/**
 * GET /api/users/:userId
 * Get user profile by ID
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users, follows, posts, streams } from '../../../db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { optionalAuth } from '../../../middleware/auth.js';

export const middleware = [optionalAuth];

export default async function handler(req: Request, res: Response) {
  try {
    const userIdParam = req.params.userId;
    console.log('🔍 GET /api/users/:userId - Looking up user:', userIdParam);
    
    // Try to parse as numeric ID first - but ONLY if the ENTIRE string is numeric
    const numericId = parseInt(userIdParam);
    const isNumericOnly = /^\d+$/.test(userIdParam); // Check if entire string is digits
    let userResult;

    if (!isNaN(numericId) && isNumericOnly) {
      // Lookup by database ID (only if entire string is numeric)
      console.log('📊 Searching by numeric ID:', numericId);
      userResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
      console.log('📥 Numeric ID search result:', userResult.length > 0 ? `Found: ${userResult[0].username} (Firebase UID: ${userResult[0].firebaseUid})` : 'Not found');
    } else {
      // Lookup by Firebase UID or username
      console.log('🔥 Searching by Firebase UID:', userIdParam);
      console.log('🔥 Expected to find user: zenaiautos (if UID is 8YuFENp2QJb6HeP7IdbMsEoGDRI3)');
      
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, userIdParam))
        .limit(1);
      
      if (userResult.length > 0) {
        console.log('📥 Firebase UID search result: Found user');
        console.log('   - ID:', userResult[0].id);
        console.log('   - Username:', userResult[0].username);
        console.log('   - Firebase UID:', userResult[0].firebaseUid);
        console.log('   - Email:', userResult[0].email);
      } else {
        console.log('📥 Firebase UID search result: Not found');
      }
      
      // If not found by UID, try username
      if (userResult.length === 0) {
        console.log('👤 Trying username search:', userIdParam);
        userResult = await db
          .select()
          .from(users)
          .where(eq(users.username, userIdParam))
          .limit(1);
        
        if (userResult.length > 0) {
          console.log('📥 Username search result: Found user');
          console.log('   - ID:', userResult[0].id);
          console.log('   - Username:', userResult[0].username);
          console.log('   - Firebase UID:', userResult[0].firebaseUid);
        } else {
          console.log('📥 Username search result: Not found');
        }
      }
    }

    if (userResult.length === 0) {
      console.log('❌ User not found:', userIdParam);
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    console.log('✅ User found:', {
      id: userResult[0].id,
      username: userResult[0].username,
      firebaseUid: userResult[0].firebaseUid
    });

    const user = userResult[0];

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const followResult = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, req.user.id), eq(follows.followingId, user.id)))
        .limit(1);

      isFollowing = followResult.length > 0;
    }

    // Get post count
    const postCountResult = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, user.id));
    const postCount = postCountResult[0]?.count || 0;

    // Get stream count
    const streamCountResult = await db
      .select({ count: count() })
      .from(streams)
      .where(eq(streams.userId, user.id));
    const streamCount = streamCountResult[0]?.count || 0;

    // Get current live stream ID if user is live
    let currentStreamId = null;
    if (user.isLive) {
      const liveStreamResult = await db
        .select({ id: streams.id })
        .from(streams)
        .where(and(eq(streams.userId, user.id), eq(streams.status, 'live')))
        .limit(1);
      
      if (liveStreamResult.length > 0) {
        currentStreamId = liveStreamResult[0].id;
      }
    }

    return res.json({
      success: true,
      user: {
        ...user,
        isFollowing,
        postCount,
        streamCount,
        currentStreamId,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user',
    });
  }
}
