/**
 * POST /api/posts
 * Create a new post - PostgreSQL version
 */

import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { posts, users } from '../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

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
    const userResult = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    if (!userResult.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Validate request body
    const { content, mediaType, mediaUrl, thumbnailUrl, streamId, linkPreview } = req.body;

    if (!content && !mediaUrl && !streamId) {
      return res.status(400).json({ error: 'Post must have content, media, or stream reference' });
    }

    if (mediaUrl && mediaType && !['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ error: 'Invalid media type. Must be "image" or "video"' });
    }

    // Create post (PostgreSQL uses returning)
    const createdPost = await db.insert(posts).values({
      userId: user.id,
      streamId: streamId || null,
      content: content || null,
      mediaType: mediaType || null,
      mediaUrl: mediaUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      linkPreview: linkPreview || null,
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
    }).returning();

    console.log('✅ Post created successfully:', { id: createdPost[0].id, userId: user.id });

    res.status(201).json({ success: true, post: createdPost[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', message: String(error) });
  }
}
