/**
 * GET /api/admin/system-streams
 * Get all system streams (24/7 channels)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const systemStreams = await db
      .select({
        id: streams.id,
        title: streams.title,
        description: streams.description,
        youtubePlaylistId: streams.youtubePlaylistId,
        currentPlaylistIndex: streams.currentPlaylistIndex,
        status: streams.status,
        viewerCount: streams.viewerCount,
      })
      .from(streams)
      .where(eq(streams.isSystemStream, true));

    return res.json({
      success: true,
      streams: systemStreams,
    });
  } catch (error) {
    console.error('Get system streams error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch system streams',
    });
  }
}
