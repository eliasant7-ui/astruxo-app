/**
 * POST /api/admin/system-streams/:streamId/reset-progress
 * Reset playlist progress to 0
 */

import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { streams } from '../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);

    if (isNaN(streamId)) {
      return res.status(400).json({
        error: 'Invalid stream ID',
      });
    }

    // Verify stream exists and is a system stream
    const stream = await db
      .select()
      .from(streams)
      .where(and(
        eq(streams.id, streamId),
        eq(streams.isSystemStream, true)
      ))
      .limit(1);

    if (stream.length === 0) {
      return res.status(404).json({
        error: 'System stream not found',
      });
    }

    // Reset progress to 0
    await db
      .update(streams)
      .set({ currentPlaylistIndex: 0 })
      .where(eq(streams.id, streamId));

    console.log(`✅ Reset playlist progress for stream ${streamId} to 0`);

    return res.json({
      success: true,
      message: 'Progress reset to 0',
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset progress',
    });
  }
}
