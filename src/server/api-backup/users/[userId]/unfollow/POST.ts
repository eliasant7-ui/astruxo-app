/**
 * POST /api/users/:userId/unfollow
 * Unfollow a user
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { users, follows } from '../../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    console.log('🔄 Unfollow endpoint called:', req.method, req.path);
    
    // Inline authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const currentUser = userResult[0];

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

    // Check if following
    const existingFollow = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, targetUserId)))
      .limit(1);

    if (existingFollow.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Not following this user',
      });
    }

    // Delete follow relationship
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, targetUserId)));

    // Update follower counts
    await db
      .update(users)
      .set({ followingCount: sql`${users.followingCount} - 1` })
      .where(eq(users.id, currentUser.id));

    await db
      .update(users)
      .set({ followerCount: sql`${users.followerCount} - 1` })
      .where(eq(users.id, targetUserId));

    return res.json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unfollow user',
    });
  }
}
