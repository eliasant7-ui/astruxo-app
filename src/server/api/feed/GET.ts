/**
 * GET /api/feed
 * Get chronological feed of posts
 * Query params:
 *   - limit: number of posts to return (default: 20, max: 50)
 *   - offset: pagination offset (default: 0)
 *   - userId: filter by specific user (optional)
 *   - mediaType: filter by media type ('image', 'video', or null for all)
 */

import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { posts, users, likes, streams } from '../../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const filterUserId = req.query.userId ? parseInt(req.query.userId as string) : null;
    const filterMediaType = req.query.mediaType as string | undefined;

    // Check if user is authenticated (optional for feed viewing)
    let currentUserId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await verifyIdToken(token);
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

    // Build where conditions
    const conditions = [];
    if (filterUserId) {
      conditions.push(eq(posts.userId, filterUserId));
    }
    if (filterMediaType) {
      conditions.push(eq(posts.mediaType, filterMediaType));
    }

    // Fetch posts with user info and current stream
    const feedPosts = await db
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
          isLive: users.isLive,
        },
        currentStreamId: streams.id,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(
        streams,
        and(
          eq(streams.userId, users.id),
          eq(streams.status, 'live')
        )
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch stream data for posts that reference streams
    const streamIds = feedPosts
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

    // If user is authenticated, check which posts they've liked
    let likedPostIds: number[] = [];
    if (currentUserId) {
      const userLikes = await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(
          and(
            eq(likes.userId, currentUserId),
            sql`${likes.postId} IN (${sql.join(feedPosts.map(p => p.id), sql`, `)})`
          )
        );
      likedPostIds = userLikes.map(l => l.postId);
    }

    // Add isLiked flag and stream data to each post
    const postsWithLikeStatus = feedPosts.map(post => ({
      ...post,
      isLiked: likedPostIds.includes(post.id),
      stream: post.streamId ? streamDataMap[post.streamId] : null,
      user: post.user ? {
        ...post.user,
        currentStreamId: post.currentStreamId,
      } : null,
    }));

    res.json({
      posts: postsWithLikeStatus,
      pagination: {
        limit,
        offset,
        hasMore: feedPosts.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed', message: String(error) });
  }
}
