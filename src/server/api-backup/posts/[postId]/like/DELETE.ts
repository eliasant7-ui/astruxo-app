/**
 * DELETE /api/posts/:postId/like
 * Unlike a post
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { posts, users, likes } from '../../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../middleware/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const firebaseUid = decodedToken.uid;

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);
    
    if (!userResult.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if post exists
    const postResult = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postResult.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user has liked this post
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, user.id)))
      .limit(1);

    if (existingLike.length === 0) {
      return res.status(400).json({ error: 'You have not liked this post' });
    }

    // Delete like
    await db
      .delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, user.id)));

    // Decrement like count on post
    await db
      .update(posts)
      .set({ likeCount: sql`${posts.likeCount} - 1` })
      .where(eq(posts.id, postId));

    // Get updated like count
    const updatedPost = await db
      .select({ likeCount: posts.likeCount })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    res.json({
      message: 'Post unliked successfully',
      likeCount: updatedPost[0].likeCount,
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ error: 'Failed to unlike post', message: String(error) });
  }
}
