/**
 * POST /api/streams/:streamId/bans
 * Ban or kick a user from a stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, streamBans, streamModerators, users } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamId } = req.params;
    const { userId: targetUserId, banType, reason } = req.body;

    if (!streamId || !targetUserId || !banType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stream ID, user ID, and ban type are required' 
      });
    }

    if (!['kick', 'ban'].includes(banType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ban type must be "kick" or "ban"' 
      });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify stream exists
    const [stream] = await db
      .select()
      .from(streams)
      .where(eq(streams.id, parseInt(streamId)))
      .limit(1);

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    // Check if user is broadcaster or moderator
    const isBroadcaster = stream.userId === currentUser.id;
    
    const [moderator] = await db
      .select()
      .from(streamModerators)
      .where(
        and(
          eq(streamModerators.streamId, parseInt(streamId)),
          eq(streamModerators.userId, currentUser.id)
        )
      )
      .limit(1);

    const isModerator = !!moderator;

    if (!isBroadcaster && !isModerator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only broadcaster or moderators can ban users' 
      });
    }

    // Cannot ban the broadcaster
    if (targetUserId === stream.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot ban the broadcaster' 
      });
    }

    // Moderators can only kick, not ban permanently
    if (isModerator && !isBroadcaster && banType === 'ban') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the broadcaster can permanently ban users' 
      });
    }

    // Check if user is already banned
    const [existingBan] = await db
      .select()
      .from(streamBans)
      .where(
        and(
          eq(streamBans.streamId, parseInt(streamId)),
          eq(streamBans.userId, targetUserId)
        )
      )
      .limit(1);

    if (existingBan) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already banned from this stream' 
      });
    }

    // Ban the user
    await db.insert(streamBans).values({
      streamId: parseInt(streamId),
      userId: targetUserId,
      bannedBy: currentUser.id,
      banType,
      reason: reason || null,
    });

    return res.json({ 
      success: true, 
      message: banType === 'kick' ? 'User kicked successfully' : 'User banned successfully',
      banType
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to ban user' 
    });
  }
}
