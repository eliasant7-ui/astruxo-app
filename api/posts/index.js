// Vercel Serverless Function - Create Post
import { db } from '../db/client.js';
import { posts, users } from '../db/schema.js';
import { verifyIdToken } from '../services/firebase.js';
import { eq } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Create post
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

    console.log('✅ Post created:', createdPost[0].id);

    res.status(201).json({ success: true, post: createdPost[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', message: String(error) });
  }
}
