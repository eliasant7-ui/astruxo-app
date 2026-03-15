/**
 * GET /api/posts/:postId
 * Get a specific post by ID
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { posts, users, likes } from '../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../middleware/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if user is authenticated (optional)
    let currentUserId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await verifyFirebaseToken(token);
      if (decodedToken) {
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.firebaseUid, decodedToken.uid))
          .limit(1);
        if (userResult.length) {
          currentUserId = userResult[0].id;
        }
      }
    }

    // Fetch post with user info
    const postResult = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaType: posts.mediaType,
        mediaUrl: posts.mediaUrl,
        thumbnailUrl: posts.thumbnailUrl,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          followerCount: users.followerCount,
          firebaseUid: users.firebaseUid,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postResult.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult[0];

    // Check if current user liked this post
    let isLiked = false;
    if (currentUserId) {
      const likeResult = await db
        .select()
        .from(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, currentUserId)))
        .limit(1);
      isLiked = likeResult.length > 0;
    }

    // Increment view count
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));

    res.json({
      post: {
        ...post,
        isLiked,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post', message: String(error) });
  }
}
