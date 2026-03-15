/**
 * GET /api/users/:userId/following
 * Get list of users that this user follows
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { users, follows } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Parse user ID - support numeric ID, Firebase UID, or username
    const userIdParam = req.params.userId;
    const numericId = parseInt(userIdParam);
    const isNumericOnly = /^\d+$/.test(userIdParam);
    let userResult;
    let userId: number;

    if (!isNaN(numericId) && isNumericOnly) {
      // Lookup by database ID (only if entire string is numeric)
      userResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      // Lookup by Firebase UID or username
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, userIdParam))
        .limit(1);
      
      // If not found by UID, try username
      if (userResult.length === 0) {
        userResult = await db
          .select()
          .from(users)
          .where(eq(users.username, userIdParam))
          .limit(1);
      }
    }

    if (userResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    userId = userResult[0].id;

    // Get following with user details
    const following = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        followerCount: users.followerCount,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return res.json({
      success: true,
      following,
      count: following.length,
    });
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get following',
    });
  }
}
