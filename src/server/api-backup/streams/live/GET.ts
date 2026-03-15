/**
 * GET /api/streams/live
 * Get all currently live streams
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams, users } from '../../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Get live streams with user details
    const liveStreams = await db
      .select({
        id: streams.id,
        title: streams.title,
        description: streams.description,
        thumbnailUrl: streams.thumbnailUrl,
        viewerCount: streams.viewerCount,
        startedAt: streams.startedAt,
        isSystemStream: streams.isSystemStream,
        youtubePlaylistId: streams.youtubePlaylistId,
        user: {
          id: users.id,
          firebaseUid: users.firebaseUid,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          followerCount: users.followerCount,
        },
      })
      .from(streams)
      .innerJoin(users, eq(streams.userId, users.id))
      .where(eq(streams.status, 'live'))
      .orderBy(desc(streams.viewerCount), desc(streams.startedAt));

    return res.json({
      success: true,
      streams: liveStreams,
      count: liveStreams.length,
    });
  } catch (error) {
    console.error('Get live streams error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get live streams',
    });
  }
}
