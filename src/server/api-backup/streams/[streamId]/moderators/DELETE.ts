/**
 * DELETE /api/streams/:streamId/moderators
 * Remove a moderator from a stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, streamModerators, users } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

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
    const decodedToken = await verifyFirebaseToken(token);
    
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
        message: 'Only the broadcaster can remove moderators' 
      });
    }

    // Remove moderator
    await db
      .delete(streamModerators)
      .where(
        and(
          eq(streamModerators.streamId, parseInt(streamId)),
          eq(streamModerators.userId, moderatorUserId)
        )
      );

    return res.json({ 
      success: true, 
      message: 'Moderator removed successfully' 
    });
  } catch (error) {
    console.error('Error removing moderator:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to remove moderator' 
    });
  }
}
