/**
 * POST /api/streams/:streamId/end
 * End a live stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { users, streams, follows, giftTransactions, chatMessages } from '../../../../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  console.log('🎯 END STREAM HANDLER CALLED');
  console.log('🔍 Authorization header:', req.headers.authorization);
  
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

    const streamId = parseInt(req.params.streamId);

    if (isNaN(streamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid stream ID',
      });
    }

    // Fetch stream
    const streamResult = await db.select().from(streams).where(eq(streams.id, streamId)).limit(1);

    if (streamResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Stream not found',
      });
    }

    const stream = streamResult[0];

    // Check if user owns this stream
    if (stream.userId !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only end your own streams',
      });
    }

    // Check if stream is already ended
    if (stream.status === 'ended') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Stream is already ended',
      });
    }

    // End stream
    console.log('🛑 Ending stream:', streamId);
    await db
      .update(streams)
      .set({
        status: 'ended',
        endedAt: new Date(),
      })
      .where(eq(streams.id, streamId));

    // Update user's isLive status
    await db.update(users).set({ isLive: false }).where(eq(users.id, user.id));

    // Fetch updated stream
    const updatedStream = await db.select().from(streams).where(eq(streams.id, streamId)).limit(1);

    // Calculate summary statistics - simplified approach
    console.log('📊 Calculating stream statistics...');
    
    // Count new followers during stream (simplified - just count all followers)
    const newFollowersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, user.id));
    const totalFollowers = Number(newFollowersResult[0]?.count || 0);
    const newFollowers = 0; // We'll show total followers instead

    // Calculate coins earned from gifts during THIS stream only
    const giftsResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${giftTransactions.coinAmount}), 0)` 
      })
      .from(giftTransactions)
      .where(eq(giftTransactions.streamId, streamId));
    const coinsEarned = Number(giftsResult[0]?.total || 0);

    // Count total comments during THIS stream
    const commentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.streamId, streamId));
    const commentsCount = Number(commentsResult[0]?.count || 0);

    console.log('✅ Stream ended successfully');
    console.log('📊 Summary:', { newFollowers, coinsEarned, commentsCount });

    return res.json({
      success: true,
      message: 'Stream ended successfully',
      stream: updatedStream[0],
      summary: {
        totalViewers: stream.peakViewerCount || 0,
        newFollowers,
        coinsEarned,
        commentsCount,
      },
    });
  } catch (error) {
    console.error('❌ End stream error:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to end stream',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
