/**
 * POST /api/streams/start
 * Start a new live stream
 * 
 * Uses database transaction with row-level locking to prevent race conditions
 * when a user tries to start multiple streams concurrently.
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users, streams } from '../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';
import { generateAgoraPublisherToken, getAgoraAppId } from '../../../services/agora.js';
import { bootstrapService } from '../../../services/bootstrap-service.js';

export default async function handler(req: Request, res: Response) {
  console.log('🎯 START STREAM HANDLER CALLED');
  console.log('🔍 Authorization header:', req.headers.authorization);
  console.log('🔍 req.body:', req.body);

  try {
    // Manual authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔍 Token received, length:', idToken.length);

    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      console.log('❌ Token verification failed');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    console.log('✅ Token verified for Firebase UID:', decodedToken.uid);

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const user = userResult[0];
    console.log('✅ User loaded:', user.username);

    const { title, description, goalAmount, entryPrice, thumbnailUrl } = req.body;
    console.log('🎯 Received monetization settings:', { goalAmount, entryPrice, thumbnailUrl });

    // Server-side validation
    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Stream title is required',
      });
    }

    // Validate title length (1-255 characters)
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 255) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Stream title must be between 1 and 255 characters',
      });
    }

    // Validate description if provided (max 1000 characters)
    let validatedDescription: string | null = null;
    if (description && typeof description === 'string') {
      validatedDescription = description.slice(0, 1000);
    }

    // Validate thumbnailUrl if provided
    let validatedThumbnailUrl: string | null = null;
    if (thumbnailUrl && typeof thumbnailUrl === 'string') {
      // Basic URL validation
      try {
        new URL(thumbnailUrl);
        validatedThumbnailUrl = thumbnailUrl.slice(0, 2048);
      } catch {
        console.log('⚠️ Invalid thumbnail URL format');
      }
    }

    // Validate monetization settings
    let validatedGoalAmount: number | null = null;
    if (goalAmount !== undefined && goalAmount !== null) {
      validatedGoalAmount = Math.max(0, Math.min(10000000, parseInt(goalAmount)));
    }

    let validatedEntryPrice: number | null = null;
    if (entryPrice !== undefined && entryPrice !== null) {
      validatedEntryPrice = Math.max(0, Math.min(1000000, parseInt(entryPrice)));
    }

    // Use transaction with row-level locking to prevent race conditions
    // This ensures atomic check-and-create for concurrent stream start requests
    const result = await db.transaction(async (tx) => {
      // Lock the user row to prevent concurrent modifications
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
        .then(rows => {
          // Use FOR UPDATE to lock the row (MySQL/MariaDB)
          // This prevents other transactions from modifying this user until we commit
          return tx.execute(sql.raw(`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`));
        });

      // Check if user already has an active stream (inside transaction)
      const activeStream = await tx
        .select()
        .from(streams)
        .where(and(eq(streams.userId, user.id), eq(streams.status, 'live')))
        .limit(1);

      if (activeStream.length > 0) {
        console.log('⚠️ User has an active stream, auto-closing it:', activeStream[0].id);

        // Auto-close the previous stream
        await tx
          .update(streams)
          .set({
            status: 'ended',
            endedAt: new Date(),
          })
          .where(eq(streams.id, activeStream[0].id));

        console.log('✅ Previous stream auto-closed');
      }

      // Generate unique channel ID
      const channelId = `stream_${user.id}_${Date.now()}`;

      // Generate Agora token for publisher
      const agoraAppId = getAgoraAppId();
      const agoraToken = generateAgoraPublisherToken(channelId, user.id);

      if (!agoraAppId || !agoraToken) {
        throw new Error('Failed to generate Agora credentials');
      }

      // Create stream record
      const streamData: any = {
        userId: user.id,
        slug: user.username,
        title: trimmedTitle,
        description: validatedDescription,
        thumbnailUrl: validatedThumbnailUrl,
        status: 'live',
        agoraChannelId: channelId,
        viewerCount: 0,
        peakViewerCount: 0,
      };

      // Add optional monetization settings
      if (validatedGoalAmount !== null && validatedGoalAmount > 0) {
        streamData.goalAmount = validatedGoalAmount;
        streamData.currentGoalProgress = 0;
      }
      if (validatedEntryPrice !== null && validatedEntryPrice > 0) {
        streamData.entryPrice = validatedEntryPrice;
        streamData.isPrivate = true;
        console.log('🔒 Stream has entry price, automatically setting isPrivate = true');
      }

      const insertResult = await tx.insert(streams).values(streamData);
      const streamId = Number(insertResult[0].insertId);

      // Update user's isLive status
      await tx.update(users).set({ isLive: true }).where(eq(users.id, user.id));

      // Fetch created stream
      const newStream = await tx.select().from(streams).where(eq(streams.id, streamId)).limit(1);

      return { streamId, stream: newStream[0], channelId, agoraAppId, agoraToken };
    });

    // Create stream announcement (async, don't wait)
    bootstrapService.announceStream(result.streamId, user.displayName || user.username, result.stream.title).catch(err => {
      console.error('Failed to create stream announcement:', err);
    });

    console.log('✅ Stream created successfully:', result.streamId);

    return res.status(201).json({
      success: true,
      message: 'Stream started successfully',
      stream: result.stream,
      credentials: {
        appId: result.agoraAppId,
        channelName: result.channelId,
        token: result.agoraToken,
        uid: user.id,
      },
    });
  } catch (error) {
    console.error('Start stream error:', error);
    
    // Check if it's a deadlock or lock timeout error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('deadlock') || errorMessage.includes('Lock wait timeout')) {
      console.error('🔒 Database lock conflict detected');
      return res.status(409).json({
        error: 'Conflict',
        message: 'Another stream operation is in progress. Please try again.',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start stream',
    });
  }
}
