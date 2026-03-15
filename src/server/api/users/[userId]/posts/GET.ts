/**
 * GET /api/users/:userId/posts
 * Get posts by a specific user
 * Query params:
 *   - limit: number of posts to return (default: 20, max: 50)
 *   - offset: pagination offset (default: 0)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { posts, users, likes } from '../../../../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    const userIdParam = req.params.userId;
    console.log('🔍 GET /api/users/:userId/posts - Looking up user:', userIdParam);
    
    // Try to parse as numeric ID first - but ONLY if the ENTIRE string is numeric
    const numericId = parseInt(userIdParam);
    const isNumericOnly = /^\d+$/.test(userIdParam); // Check if entire string is digits
    let userResult;
    let userId: number;

    if (!isNaN(numericId) && isNumericOnly) {
      // Lookup by database ID (only if entire string is numeric)
      console.log('📊 Searching by numeric ID:', numericId);
      userResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      // Lookup by Firebase UID or username
      console.log('🔥 Searching by Firebase UID or username:', userIdParam);
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, userIdParam))
        .limit(1);
      
      console.log('📥 Firebase UID search result:', userResult.length > 0 ? `Found: ${userResult[0].username}` : 'Not found');
      
      // If not found by UID, try username
      if (userResult.length === 0) {
        console.log('👤 Trying username search:', userIdParam);
        userResult = await db
          .select()
          .from(users)
          .where(eq(users.username, userIdParam))
          .limit(1);
        
        console.log('📥 Username search result:', userResult.length > 0 ? `Found: ${userResult[0].username}` : 'Not found');
      }
    }

    if (userResult.length === 0) {
      console.log('❌ User not found for posts lookup');
      return res.status(404).json({ error: 'User not found' });
    }

    userId = userResult[0].id;
    console.log('✅ Found user for posts:', {
      id: userId,
      username: userResult[0].username,
      firebaseUid: userResult[0].firebaseUid
    });

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if request is authenticated (optional)
    let currentUserId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await verifyIdToken(token);
        if (decodedToken) {
          const currentUserResult = await db
            .select()
            .from(users)
            .where(eq(users.firebaseUid, decodedToken.uid))
            .limit(1);
          if (currentUserResult.length) {
            currentUserId = currentUserResult[0].id;
          }
        }
      } catch (error) {
        // Ignore auth errors for optional auth
      }
    }

    // Fetch user's posts with user info and like status
    const userPosts = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        streamId: posts.streamId,
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
        isLiked: currentUserId
          ? sql<boolean>`EXISTS(
              SELECT 1 FROM ${likes}
              WHERE ${likes.postId} = ${posts.id}
              AND ${likes.userId} = ${currentUserId}
            )`
          : sql<boolean>`false`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch stream data for posts that reference streams
    const { streams } = await import('../../../../db/schema.js');
    const streamIds = userPosts
      .filter(p => p.streamId)
      .map(p => p.streamId as number);

    let streamDataMap: Record<number, any> = {};
    if (streamIds.length > 0) {
      const streamData = await db
        .select({
          id: streams.id,
          title: streams.title,
          description: streams.description,
          thumbnailUrl: streams.thumbnailUrl,
          status: streams.status,
          viewerCount: streams.viewerCount,
          slug: streams.slug,
        })
        .from(streams)
        .where(sql`${streams.id} IN (${sql.join(streamIds, sql`, `)})`);

      streamDataMap = Object.fromEntries(
        streamData.map(s => [s.id, s])
      );
    }

    // Add stream data to posts
    const postsWithStreams = userPosts.map(post => ({
      ...post,
      stream: post.streamId ? streamDataMap[post.streamId] : null,
    }));

    res.json({
      posts: postsWithStreams,
      pagination: {
        limit,
        offset,
        hasMore: userPosts.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts', message: String(error) });
  }
}
