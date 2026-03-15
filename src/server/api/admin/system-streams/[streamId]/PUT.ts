/**
 * PUT /api/admin/system-streams/:streamId
 * Update system stream details
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);
    const { title, description, youtubePlaylistId } = req.body;

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

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (youtubePlaylistId !== undefined) updateData.youtubePlaylistId = youtubePlaylistId;

    // Update stream
    await db
      .update(streams)
      .set(updateData)
      .where(eq(streams.id, streamId));

    console.log(`✅ Updated system stream ${streamId}:`, updateData);

    return res.json({
      success: true,
      message: 'Stream updated successfully',
    });
  } catch (error) {
    console.error('Update system stream error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update system stream',
    });
  }
}
