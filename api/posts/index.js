// Vercel Serverless Function - Create Post
import { neon } from '@neondatabase/serverless';
import { verifyIdToken } from '../../src/server/services/firebase.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const sql = neon(databaseUrl);

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
    const userResult = await sql`
      SELECT * FROM users WHERE "firebaseUid" = ${firebaseUid} LIMIT 1
    `;

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found. Please complete profile setup at /sync-user' });
    }

    const user = userResult[0];

    // Validate request body
    const { content, mediaType, mediaUrl, thumbnailUrl, streamId, linkPreview } = req.body;

    if (!content && !mediaUrl && !streamId) {
      return res.status(400).json({ error: 'Post must have content, media, or stream reference' });
    }

    // Create post
    const createdPost = await sql`
      INSERT INTO posts (
        "userId",
        "streamId",
        content,
        "mediaType",
        "mediaUrl",
        "thumbnailUrl",
        "linkPreview",
        "likeCount",
        "commentCount",
        "viewCount"
      ) VALUES (
        ${user.id},
        ${streamId || null},
        ${content || null},
        ${mediaType || null},
        ${mediaUrl || null},
        ${thumbnailUrl || null},
        ${linkPreview || null},
        0,
        0,
        0
      )
      RETURNING *
    `;

    console.log('✅ Post created:', createdPost[0].id);

    res.status(201).json({ 
      success: true, 
      post: {
        ...createdPost[0],
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          followerCount: user.followerCount,
          firebaseUid: user.firebaseUid,
          isLive: user.isLive,
        }
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', message: String(error) });
  }
}
