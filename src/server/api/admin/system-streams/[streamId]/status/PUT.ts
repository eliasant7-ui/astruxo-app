/**
 * PUT /api/admin/system-streams/:streamId/status
 * Toggle stream status (live/ended)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { streams } from '../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);
    const { status } = req.body;

    if (isNaN(streamId)) {
      return res.status(400).json({
        error: 'Invalid stream ID',
      });
    }

    if (!status || !['live', 'ended'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be "live" or "ended"',
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

    // Update status
    await db
      .update(streams)
      .set({ status })
      .where(eq(streams.id, streamId));

    console.log(`✅ Updated stream ${streamId} status to: ${status}`);

    return res.json({
      success: true,
      status,
      message: `Stream ${status === 'live' ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update status',
    });
  }
}
