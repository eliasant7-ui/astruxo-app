/**
 * POST /api/posts/:postId/comments
 * Create a comment on a post
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { posts, users, comments } from '../../../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
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

    // Validate request body
    const { content, parentId } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parentId))
        .limit(1);

      if (!parentComment.length) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
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

    // Create comment
    const result = await db.insert(comments).values({
      postId,
      userId: user.id,
      content: content.trim(),
      parentId: parentId || null,
      likeCount: 0,
      replyCount: 0,
    });

    const commentId = Number(result[0].insertId);

    // Increment comment count on post
    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));

    // If this is a reply, increment reply count on parent comment
    if (parentId) {
      await db
        .update(comments)
        .set({ replyCount: sql`${comments.replyCount} + 1` })
        .where(eq(comments.id, parentId));
    }

    // Fetch the created comment with user info
    const createdComment = await db
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
      .where(eq(comments.id, commentId))
      .limit(1);

    res.status(201).json({ comment: createdComment[0] });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', message: String(error) });
  }
}
