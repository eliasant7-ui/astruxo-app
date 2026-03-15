/**
 * GET /api/streams/:streamId/moderators
 * Get list of moderators for a stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streamModerators, users } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamId } = req.params;

    if (!streamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stream ID is required' 
      });
    }

    // Get moderators with user details
    const moderators = await db
      .select({
        id: streamModerators.id,
        userId: streamModerators.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        assignedAt: streamModerators.assignedAt,
      })
      .from(streamModerators)
      .leftJoin(users, eq(streamModerators.userId, users.id))
      .where(eq(streamModerators.streamId, parseInt(streamId)));

    return res.json({ 
      success: true, 
      moderators 
    });
  } catch (error) {
    console.error('Error fetching moderators:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch moderators' 
    });
  }
}
