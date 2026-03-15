/**
 * PUT /api/streams/:streamId/settings
 * Update stream monetization settings (goal, entry price)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, users } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';
import { getSocketIO } from '../../../../services/socket.js';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);
    const { goalAmount, entryPrice } = req.body;

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get the stream
    const [stream] = await db
      .select()
      .from(streams)
      .where(eq(streams.id, streamId))
      .limit(1);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Verify ownership
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!user || user.id !== stream.userId) {
      return res.status(403).json({ error: 'You can only update your own streams' });
    }

    // Update settings
    const updateData: any = {};
    let privacyChanged = false;
    let oldEntryPrice = stream.entryPrice;
    
    if (goalAmount !== undefined) {
      updateData.goalAmount = goalAmount;
      updateData.currentGoalProgress = 0; // Reset progress when goal changes
    }
    if (entryPrice !== undefined) {
      updateData.entryPrice = entryPrice;
      
      // If entry price is set, automatically make stream private
      if (entryPrice > 0) {
        updateData.isPrivate = true;
        privacyChanged = true;
      }
      // If entry price is removed and stream was private due to entry price, make it public
      else if (entryPrice === 0 && oldEntryPrice && oldEntryPrice > 0) {
        updateData.isPrivate = false;
        privacyChanged = true;
      }
    }

    await db
      .update(streams)
      .set(updateData)
      .where(eq(streams.id, streamId));

    // Emit Socket.IO event if privacy changed
    if (privacyChanged) {
      const io = getSocketIO();
      if (io) {
        const roomName = `stream_${streamId}`;
        io.to(roomName).emit('privacy_changed', {
          isPrivate: updateData.isPrivate,
          entryPrice: entryPrice,
        });
        console.log(`🔒 Privacy change broadcasted to room ${roomName}: isPrivate=${updateData.isPrivate}, entryPrice=${entryPrice}`);
      }
    }

    return res.json({
      success: true,
      message: 'Stream settings updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating stream settings:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update stream settings',
    });
  }
}
