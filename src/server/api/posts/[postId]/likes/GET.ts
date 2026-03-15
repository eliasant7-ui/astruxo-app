/**
 * GET /api/posts/:postId/likes
 * Get list of users who liked a post
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { likes, users } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Get all users who liked this post
    const postLikes = await db
      .select({
        id: likes.id,
        userId: likes.userId,
        createdAt: likes.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          followerCount: users.followerCount,
        },
      })
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.postId, postId))
      .orderBy(likes.createdAt);

    res.json({
      likes: postLikes,
      count: postLikes.length,
    });
  } catch (error) {
    console.error('Error fetching post likes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch post likes', 
      message: String(error) 
    });
  }
}
