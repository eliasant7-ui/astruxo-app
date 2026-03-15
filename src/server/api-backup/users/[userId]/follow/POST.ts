/**
 * POST /api/users/:userId/follow
 * Follow a user
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { users, follows } from '../../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    console.log('🔄 Follow endpoint called:', req.method, req.path);
    
    // Inline authentication
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔍 Token length:', idToken.length);
    
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      console.error('❌ Token verification failed');
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
      console.error('❌ User not found in database');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const currentUser = userResult[0];
    console.log('✅ User loaded:', currentUser.username);

    // Parse target user ID - support numeric ID, Firebase UID, or username
    const targetUserIdParam = req.params.userId;
    const numericId = parseInt(targetUserIdParam);
    const isNumericOnly = /^\d+$/.test(targetUserIdParam);
    let targetUserResult;
    let targetUserId: number;

    if (!isNaN(numericId) && isNumericOnly) {
      // Lookup by database ID (only if entire string is numeric)
      targetUserResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      // Lookup by Firebase UID or username
      targetUserResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, targetUserIdParam))
        .limit(1);
      
      // If not found by UID, try username
      if (targetUserResult.length === 0) {
        targetUserResult = await db
          .select()
          .from(users)
          .where(eq(users.username, targetUserIdParam))
          .limit(1);
      }
    }

    if (targetUserResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    targetUserId = targetUserResult[0].id;

    // Can't follow yourself
    if (currentUser.id === targetUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot follow yourself',
      });
    }

    // Check if already following
    const existingFollow = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, targetUserId)))
      .limit(1);

    if (existingFollow.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Already following this user',
      });
    }

    // Create follow relationship
    await db.insert(follows).values({
      followerId: currentUser.id,
      followingId: targetUserId,
    });

    // Update follower counts
    await db
      .update(users)
      .set({ followingCount: sql`${users.followingCount} + 1` })
      .where(eq(users.id, currentUser.id));

    await db
      .update(users)
      .set({ followerCount: sql`${users.followerCount} + 1` })
      .where(eq(users.id, targetUserId));

    return res.status(201).json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error) {
    console.error('Follow user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to follow user',
    });
  }
}
