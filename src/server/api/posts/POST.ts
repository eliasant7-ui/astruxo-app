/**
 * POST /api/posts
 * Create a new post
 */

import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { posts } from '../../db/schema.js';
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
    const { users } = await import('../../db/schema.js');
    const { eq } = await import('drizzle-orm');
    
    const userResult = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    if (!userResult.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Validate request body
    const { content, mediaType, mediaUrl, thumbnailUrl, streamId, linkPreview } = req.body;

    // At least content, media, or streamId must be provided
    if (!content && !mediaUrl && !streamId) {
      return res.status(400).json({ error: 'Post must have content, media, or stream reference' });
    }

    // Validate mediaType if mediaUrl is provided
    if (mediaUrl && mediaType && !['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ error: 'Invalid media type. Must be "image" or "video"' });
    }

    // Validate mediaType for livestream posts
    if (streamId && mediaType !== 'livestream') {
      return res.status(400).json({ error: 'Stream posts must have mediaType "livestream"' });
    }

    // Create post
    const result = await db.insert(posts).values({
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
    });

    const postId = Number(result[0].insertId);

    // Fetch the created post with user info and stream info if applicable
    const { streams } = await import('../../db/schema.js');

    const createdPost = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        streamId: posts.streamId,
        content: posts.content,
        mediaType: posts.mediaType,
        mediaUrl: posts.mediaUrl,
        thumbnailUrl: posts.thumbnailUrl,
        linkPreview: posts.linkPreview,
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
        stream: {
          id: streams.id,
          title: streams.title,
          description: streams.description,
          thumbnailUrl: streams.thumbnailUrl,
          status: streams.status,
          viewerCount: streams.viewerCount,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(streams, eq(posts.streamId, streams.id))
      .where(eq(posts.id, postId))
      .limit(1);

    // Validate post was created successfully before returning
    if (!createdPost.length || !createdPost[0].id || !createdPost[0].userId) {
      console.error('❌ Post creado pero no se pudo recuperar:', postId);
      return res.status(500).json({ error: 'Error al recuperar el post creado' });
    }

    // Log para debugging
    console.log('✅ Post creado exitosamente:', { id: postId, userId: user.id });

    res.status(201).json({ success: true, post: createdPost[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', message: String(error) });
  }
}
