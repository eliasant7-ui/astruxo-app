// Vercel Serverless Function - Get Feed
import { db } from '../../src/server/db/client.js';
import { posts, users, streams } from '../../src/server/db/schema.js';
import { desc, sql } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    // Fetch posts with user info
    const feedPosts = await db
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
          isLive: users.isLive,
        },
        currentStreamId: streams.id,
      })
      .from(posts)
      .leftJoin(users, sql`${posts.userId} = ${users.id}`)
      .leftJoin(streams, sql`${posts.streamId} = ${streams.id} AND ${streams.status} = 'live'`)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);

    res.status(200).json({
      success: true,
      posts: feedPosts,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit,
        offset,
        hasMore: (totalCount[0]?.count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed', message: String(error) });
  }
}
