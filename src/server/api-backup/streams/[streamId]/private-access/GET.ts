/**
 * GET /api/streams/:streamId/private-access
 * Check if user has access to private stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { privateStreamAccess, gifts, streams, giftTransactions } from '../../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';
import { users } from '../../../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);

    if (isNaN(streamId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid stream ID',
      });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const user = userResult[0];

    // Get stream details
    const streamResult = await db
      .select()
      .from(streams)
      .where(eq(streams.id, streamId))
      .limit(1);

    if (streamResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Stream not found',
      });
    }

    const stream = streamResult[0];

    // Check if user is the broadcaster
    if (stream.userId === user.id) {
      return res.json({
        success: true,
        hasAccess: true,
        requiredGift: null,
      });
    }

    // Check if user has access via private_stream_access table
    const accessResult = await db
      .select()
      .from(privateStreamAccess)
      .where(and(
        eq(privateStreamAccess.streamId, streamId),
        eq(privateStreamAccess.userId, user.id)
      ))
      .limit(1);

    let hasAccess = accessResult.length > 0;

    // If no explicit access, check if user has sent enough coins in this stream
    if (!hasAccess && stream.requiredGiftId) {
      const giftResult = await db
        .select()
        .from(gifts)
        .where(eq(gifts.id, stream.requiredGiftId))
        .limit(1);

      if (giftResult.length > 0) {
        const requiredGiftPrice = giftResult[0].coinPrice;

        // Sum all gifts sent by this user in this stream
        const totalCoinsResult = await db
          .select({
            total: sql<number>`COALESCE(SUM(${giftTransactions.coinAmount}), 0)`,
          })
          .from(giftTransactions)
          .where(and(
            eq(giftTransactions.streamId, streamId),
            eq(giftTransactions.senderId, user.id)
          ));

        const totalCoinsSent = totalCoinsResult[0]?.total || 0;

        // If user has sent enough coins, grant access
        if (totalCoinsSent >= requiredGiftPrice) {
          hasAccess = true;

          // Also add to private_stream_access table for future checks
          try {
            await db.insert(privateStreamAccess).values({
              streamId,
              userId: user.id,
              grantedAt: new Date(),
            });
          } catch (error) {
            // Ignore duplicate key errors
            console.log('Access already exists or error inserting:', error);
          }
        }
      }
    }

    // Get required gift details if stream is private
    let requiredGift = null;
    if (stream.requiredGiftId) {
      const giftResult = await db
        .select()
        .from(gifts)
        .where(eq(gifts.id, stream.requiredGiftId))
        .limit(1);

      if (giftResult.length > 0) {
        requiredGift = giftResult[0];
      }
    }

    return res.json({
      success: true,
      hasAccess,
      requiredGift,
    });
  } catch (error) {
    console.error('Check private access error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check private access',
    });
  }
}
