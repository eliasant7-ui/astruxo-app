/**
 * GET /api/posts/:postId/comments
 * Get comments for a post
 * Query params:
 *   - limit: number of comments to return (default: 20, max: 100)
 *   - offset: pagination offset (default: 0)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { posts, users, comments } from '../../../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if post exists
    const postResult = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postResult.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Fetch comments with user info
    const postComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      comments: postComments,
      pagination: {
        limit,
        offset,
        hasMore: postComments.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', message: String(error) });
  }
}
