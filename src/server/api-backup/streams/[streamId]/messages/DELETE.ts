/**
 * DELETE /api/streams/:streamId/messages
 * Delete a message from stream chat
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, deletedMessages, streamModerators, users } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamId } = req.params;
    const { messageId, userId: messageUserId, content } = req.body;

    if (!streamId || !messageId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stream ID and message ID are required' 
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
        message: 'Only broadcaster or moderators can delete messages' 
      });
    }

    // Log the deleted message
    await db.insert(deletedMessages).values({
      streamId: parseInt(streamId),
      messageId,
      userId: messageUserId,
      content: content || '',
      deletedBy: currentUser.id,
    });

    return res.json({ 
      success: true, 
      message: 'Message deleted successfully',
      messageId
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete message' 
    });
  }
}
