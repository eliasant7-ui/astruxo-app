/**
 * Get Stream Preview Data
 * POST /api/streams/preview
 * Returns stream info for link previews
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams, users } from '../../../db/schema.js';
import { eq, or } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamIdentifier } = req.body;

    if (!streamIdentifier) {
      return res.status(400).json({ error: 'Stream identifier required' });
    }

    // Try to parse as numeric ID
    const streamId = parseInt(streamIdentifier);
    const isNumericId = !isNaN(streamId);

    console.log('🔍 Stream preview request:', { streamIdentifier, isNumericId });

    // Query stream by ID or slug
    const streamQuery = db
      .select({
        id: streams.id,
        slug: streams.slug,
        title: streams.title,
        description: streams.description,
        thumbnailUrl: streams.thumbnailUrl,
        status: streams.status,
        viewerCount: streams.viewerCount,
        startedAt: streams.startedAt,
        isSystemStream: streams.isSystemStream,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(streams)
      .innerJoin(users, eq(streams.userId, users.id));

    const streamResult = isNumericId
      ? await streamQuery.where(eq(streams.id, streamId)).limit(1)
      : await streamQuery.where(eq(streams.slug, streamIdentifier)).limit(1);

    if (streamResult.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const stream = streamResult[0];

    // Return preview data
    return res.json({
      success: true,
      preview: {
        type: 'livestream',
        streamId: stream.id,
        slug: stream.slug,
        title: stream.title,
        description: stream.description,
        thumbnailUrl: stream.thumbnailUrl || stream.user.avatarUrl,
        status: stream.status,
        viewerCount: stream.viewerCount,
        isLive: stream.status === 'live',
        broadcaster: {
          username: stream.user.username,
          displayName: stream.user.displayName,
          avatarUrl: stream.user.avatarUrl,
        },
        startedAt: stream.startedAt,
        isSystemStream: stream.isSystemStream,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching stream preview:', error);
    return res.status(500).json({
      error: 'Failed to fetch stream preview',
      message: String(error),
    });
  }
}
