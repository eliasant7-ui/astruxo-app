/**
 * DELETE /api/posts/:postId
 * Delete a post (only by the post owner)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { posts, users, comments, likes } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
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

    // Check if post exists and belongs to user
    const postResult = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postResult.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postResult[0].userId !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete associated comments
    await db.delete(comments).where(eq(comments.postId, postId));

    // Delete associated likes
    await db.delete(likes).where(eq(likes.postId, postId));

    // Delete the post
    await db.delete(posts).where(eq(posts.id, postId));

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post', message: String(error) });
  }
}
