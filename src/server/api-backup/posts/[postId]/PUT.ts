/**
 * PUT /api/posts/:postId
 * Update a post
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { posts, users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    const postId = parseInt(req.params.postId);
    const { content } = req.body;

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

    // Validate input
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get the post to verify ownership
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get user to verify ownership
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!user || user.id !== post.userId) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }

    // Update the post
    await db
      .update(posts)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // Fetch the updated post
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return res.json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('❌ Error updating post:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update post',
    });
  }
}
