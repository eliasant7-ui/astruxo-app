/**
 * POST /api/streams/:streamId/moderators
 * Assign a moderator to a stream (max 3 moderators)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, streamModerators, users } from '../../../../db/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamId } = req.params;
    const { userId: moderatorUserId } = req.body;

    if (!streamId || !moderatorUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stream ID and user ID are required' 
      });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get broadcaster user
    const [broadcaster] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!broadcaster) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify stream exists and user is the broadcaster
    const [stream] = await db
      .select()
      .from(streams)
      .where(eq(streams.id, parseInt(streamId)))
      .limit(1);

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    if (stream.userId !== broadcaster.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the broadcaster can assign moderators' 
      });
    }

    // Check if stream is still live
    if (stream.status !== 'live') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only assign moderators to live streams' 
      });
    }

    // Check moderator limit (max 3)
    const [moderatorCount] = await db
      .select({ count: count() })
      .from(streamModerators)
      .where(eq(streamModerators.streamId, parseInt(streamId)));

    if (moderatorCount.count >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 3 moderators allowed per stream' 
      });
    }

    // Check if user is already a moderator
    const [existingMod] = await db
      .select()
      .from(streamModerators)
      .where(
        and(
          eq(streamModerators.streamId, parseInt(streamId)),
          eq(streamModerators.userId, moderatorUserId)
        )
      )
      .limit(1);

    if (existingMod) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already a moderator' 
      });
    }

    // Verify moderator user exists
    const [moderatorUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, moderatorUserId))
      .limit(1);

    if (!moderatorUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Moderator user not found' 
      });
    }

    // Assign moderator
    await db.insert(streamModerators).values({
      streamId: parseInt(streamId),
      userId: moderatorUserId,
      assignedBy: broadcaster.id,
    });

    return res.json({ 
      success: true, 
      message: 'Moderator assigned successfully',
      moderator: {
        id: moderatorUser.id,
        username: moderatorUser.username,
        displayName: moderatorUser.displayName,
        avatarUrl: moderatorUser.avatarUrl,
      }
    });
  } catch (error) {
    console.error('Error assigning moderator:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to assign moderator' 
    });
  }
}
