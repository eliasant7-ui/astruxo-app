/**
 * POST /api/streams/:streamId/private
 * Make a stream private (requires gift to enter)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, users } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamId } = req.params;
    const { isPrivate, requiredGiftId } = req.body;

    if (!streamId || typeof isPrivate !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'Stream ID and isPrivate flag are required' 
      });
    }

    if (isPrivate && !requiredGiftId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required gift ID must be specified for private streams' 
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
        message: 'Only the broadcaster can change stream privacy' 
      });
    }

    // Check if stream is still live
    if (stream.status !== 'live') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only change privacy of live streams' 
      });
    }

    // Update stream privacy
    await db
      .update(streams)
      .set({
        isPrivate,
        requiredGiftId: isPrivate ? requiredGiftId : null,
      })
      .where(eq(streams.id, parseInt(streamId)));

    return res.json({ 
      success: true, 
      message: isPrivate ? 'Stream is now private' : 'Stream is now public',
      isPrivate,
      requiredGiftId: isPrivate ? requiredGiftId : null
    });
  } catch (error) {
    console.error('Error updating stream privacy:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update stream privacy' 
    });
  }
}
