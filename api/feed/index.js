// Vercel Serverless Function - Get Feed
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ error: 'Database URL not configured' });
    }

    const sql = neon(databaseUrl);

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    // Fetch posts with user info
    const feedPosts = await sql`
      SELECT 
        p.id,
        p."userId",
        p."streamId",
        p.content,
        p."mediaType",
        p."mediaUrl",
        p."thumbnailUrl",
        p."linkPreview",
        p."likeCount",
        p."commentCount",
        p."viewCount",
        p."createdAt",
        p."updatedAt",
        json_build_object(
          'id', u.id,
          'username', u.username,
          'displayName', u."displayName",
          'avatarUrl', u."avatarUrl",
          'followerCount', u."followerCount",
          'firebaseUid', u."firebaseUid",
          'isLive', u."isLive"
        ) as user,
        s.id as "currentStreamId"
      FROM posts p
      LEFT JOIN users u ON p."userId" = u.id
      LEFT JOIN streams s ON p."streamId" = s.id AND s.status = 'live'
      ORDER BY p."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count
    const totalCount = await sql`SELECT COUNT(*) FROM posts`;

    res.status(200).json({
      success: true,
      posts: feedPosts,
      pagination: {
        total: parseInt(totalCount[0]?.count) || 0,
        limit,
        offset,
        hasMore: (parseInt(totalCount[0]?.count) || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed', message: String(error) });
  }
}
