/**
 * Unlike a Comment
 * DELETE /api/posts/:postId/comments/:commentId/like
 */

import type { Request, Response } from 'express';
import { db } from '../../../../../../db/client.js';
import { commentLikes, comments, users } from '../../../../../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];
    const commentId = parseInt(req.params.commentId);

    // Check if comment exists
    const commentResult = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (commentResult.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Delete like
    await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, user.id)
        )
      );

    // Decrement like count
    const newLikeCount = Math.max(0, commentResult[0].likeCount - 1);
    await db
      .update(comments)
      .set({
        likeCount: newLikeCount,
      })
      .where(eq(comments.id, commentId));

    res.json({
      success: true,
      liked: false,
      likeCount: newLikeCount,
    });
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({ error: 'Failed to unlike comment' });
  }
}
