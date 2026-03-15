/**
 * GET /api/streams/:streamId/private
 * Check if user has access to private stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, privateStreamAccess, users } from '../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    const { streamId } = req.params;

    if (!streamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stream ID is required' 
      });
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

    // If stream is not private, everyone has access
    if (!stream.isPrivate) {
      return res.json({ 
        success: true, 
        hasAccess: true,
        isPrivate: false
      });
    }

    // Check authentication for private streams
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.json({ 
        success: true, 
        hasAccess: false,
        isPrivate: true,
        requiredGiftId: stream.requiredGiftId
      });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken) {
      return res.json({ 
        success: true, 
        hasAccess: false,
        isPrivate: true,
        requiredGiftId: stream.requiredGiftId
      });
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!currentUser) {
      return res.json({ 
        success: true, 
        hasAccess: false,
        isPrivate: true,
        requiredGiftId: stream.requiredGiftId
      });
    }

    // Broadcaster always has access
    if (stream.userId === currentUser.id) {
      return res.json({ 
        success: true, 
        hasAccess: true,
        isPrivate: true,
        isBroadcaster: true
      });
    }

    // Check if user has paid for access
    const [access] = await db
      .select()
      .from(privateStreamAccess)
      .where(
        and(
          eq(privateStreamAccess.streamId, parseInt(streamId)),
          eq(privateStreamAccess.userId, currentUser.id)
        )
      )
      .limit(1);

    return res.json({ 
      success: true, 
      hasAccess: !!access,
      isPrivate: true,
      requiredGiftId: stream.requiredGiftId
    });
  } catch (error) {
    console.error('Error checking private stream access:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to check stream access' 
    });
  }
}
