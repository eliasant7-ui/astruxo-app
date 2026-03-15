/**
 * GET /api/users/:userId/streams
 * Get user's past streams
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, users } from '../../../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Parse user ID - support numeric ID, Firebase UID, or username
    const userIdParam = req.params.userId;
    const numericId = parseInt(userIdParam);
    const isNumericOnly = /^\d+$/.test(userIdParam);
    let userResult;
    let userId: number;

    if (!isNaN(numericId) && isNumericOnly) {
      // Lookup by database ID (only if entire string is numeric)
      userResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      // Lookup by Firebase UID or username
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, userIdParam))
        .limit(1);
      
      // If not found by UID, try username
      if (userResult.length === 0) {
        userResult = await db
          .select()
          .from(users)
          .where(eq(users.username, userIdParam))
          .limit(1);
      }
    }

    if (userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    userId = userResult[0].id;

    // Get user's streams (ended streams only, ordered by most recent)
    const userStreams = await db
      .select({
        id: streams.id,
        title: streams.title,
        description: streams.description,
        status: streams.status,
        viewerCount: streams.viewerCount,
        peakViewerCount: streams.peakViewerCount,
        startedAt: streams.startedAt,
        endedAt: streams.endedAt,
        duration: streams.duration,
      })
      .from(streams)
      .where(eq(streams.userId, userId))
      .orderBy(desc(streams.startedAt))
      .limit(20);

    // Calculate total stats
    const totalStreams = userStreams.length;
    const totalViewers = userStreams.reduce((sum, stream) => sum + (stream.peakViewerCount || 0), 0);
    const totalDuration = userStreams.reduce((sum, stream) => sum + (stream.duration || 0), 0);

    res.json({
      success: true,
      streams: userStreams,
      stats: {
        totalStreams,
        totalViewers,
        totalDuration,
        averageViewers: totalStreams > 0 ? Math.round(totalViewers / totalStreams) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user streams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch streams' });
  }
}
