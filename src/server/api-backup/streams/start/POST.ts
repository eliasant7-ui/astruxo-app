/**
 * POST /api/streams/start
 * Start a new live stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users, streams } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';
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

    const decodedToken = await verifyFirebaseToken(idToken);
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

    if (!title) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Stream title is required',
      });
    }

    // Check if user already has an active stream
    const activeStream = await db
      .select()
      .from(streams)
      .where(and(eq(streams.userId, user.id), eq(streams.status, 'live')))
      .limit(1);

    if (activeStream.length > 0) {
      console.log('⚠️ User has an active stream, auto-closing it:', activeStream[0].id);
      
      // Auto-close the previous stream
      await db
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
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate streaming credentials',
      });
    }

    // Create stream record
    const streamData: any = {
      userId: user.id,
      slug: user.username, // Use username as slug for readable URLs
      title,
      description: description || null,
      thumbnailUrl: thumbnailUrl || null,
      status: 'live',
      agoraChannelId: channelId,
      viewerCount: 0,
      peakViewerCount: 0,
    };
    
    // Add optional monetization settings
    if (goalAmount !== undefined && goalAmount > 0) {
      streamData.goalAmount = goalAmount;
      streamData.currentGoalProgress = 0;
    }
    if (entryPrice !== undefined && entryPrice > 0) {
      streamData.entryPrice = entryPrice;
      // Automatically make stream private if it has entry price
      streamData.isPrivate = true;
      console.log('🔒 Stream has entry price, automatically setting isPrivate = true');
    }
    
    const result = await db.insert(streams).values(streamData);

    const streamId = Number(result[0].insertId);

    // Update user's isLive status
    await db.update(users).set({ isLive: true }).where(eq(users.id, user.id));

    // Fetch created stream
    const newStream = await db.select().from(streams).where(eq(streams.id, streamId)).limit(1);

    // Create stream announcement (async, don't wait)
    bootstrapService.announceStream(streamId, user.displayName || user.username, title).catch(err => {
      console.error('Failed to create stream announcement:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Stream started successfully',
      stream: newStream[0],
      credentials: {
        appId: agoraAppId,
        channelName: channelId, // BroadcasterView expects channelName
        token: agoraToken,
        uid: user.id,
      },
    });
  } catch (error) {
    console.error('Start stream error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start stream',
    });
  }
}
