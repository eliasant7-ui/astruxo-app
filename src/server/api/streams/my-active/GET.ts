/**
 * GET /api/streams/my-active
 * Get the current user's active livestream
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateUser } from '../../../middleware/auth.js';

export const middleware = [authenticateUser];

export default async function handler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's active stream (live or scheduled)
    const activeStream = await db
      .select()
      .from(streams)
      .where(
        and(
          eq(streams.userId, req.user.id),
          eq(streams.status, 'live')
        )
      )
      .limit(1);

    if (activeStream.length === 0) {
      return res.json({ stream: null });
    }

    res.json({ stream: activeStream[0] });
  } catch (error) {
    console.error('Error fetching active stream:', error);
    res.status(500).json({ error: 'Failed to fetch active stream' });
  }
}
