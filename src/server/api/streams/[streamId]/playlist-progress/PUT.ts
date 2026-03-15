/**
 * Update playlist progress for a system stream
 * PUT /api/streams/:streamId/playlist-progress
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);
    const { currentIndex } = req.body;

    if (isNaN(streamId)) {
      return res.status(400).json({
        error: 'Invalid stream ID',
      });
    }

    if (typeof currentIndex !== 'number' || currentIndex < 0) {
      return res.status(400).json({
        error: 'Invalid current index',
      });
    }

    // Verify stream exists and is a system stream
    const stream = await db
      .select()
      .from(streams)
      .where(eq(streams.id, streamId))
      .limit(1);

    if (stream.length === 0) {
      return res.status(404).json({
        error: 'Stream not found',
      });
    }

    if (!stream[0].isSystemStream) {
      return res.status(400).json({
        error: 'Only system streams support playlist progress',
      });
    }

    // Update playlist progress
    await db
      .update(streams)
      .set({ currentPlaylistIndex: currentIndex })
      .where(eq(streams.id, streamId));

    console.log(`✅ Updated playlist progress for stream ${streamId}: video ${currentIndex}`);

    return res.json({
      success: true,
      currentIndex,
    });
  } catch (error) {
    console.error('Update playlist progress error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update playlist progress',
    });
  }
}
