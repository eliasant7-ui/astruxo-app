/**
 * GET /api/streams/:streamId/entry-access
 * Check if user has paid entry or sent enough gifts to access paid stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, streamEntryPayments, giftTransactions, users } from '../../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = parseInt(req.params.streamId);

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

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stream
    const [stream] = await db
      .select()
      .from(streams)
      .where(eq(streams.id, streamId))
      .limit(1);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // If no entry price, everyone has access
    if (!stream.entryPrice) {
      return res.json({
        hasAccess: true,
        reason: 'no_entry_price',
      });
    }

    // If user is the broadcaster, they have access
    if (stream.userId === user.id) {
      return res.json({
        hasAccess: true,
        reason: 'broadcaster',
      });
    }

    // Check if user has already paid entry
    const [entryPayment] = await db
      .select()
      .from(streamEntryPayments)
      .where(
        and(
          eq(streamEntryPayments.streamId, streamId),
          eq(streamEntryPayments.userId, user.id)
        )
      )
      .limit(1);

    if (entryPayment) {
      return res.json({
        hasAccess: true,
        reason: 'paid_entry',
        amountPaid: entryPayment.amountPaid,
      });
    }

    // Check if user has sent enough gifts to cover entry price
    const [giftsTotal] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${giftTransactions.coinAmount}), 0)`,
      })
      .from(giftTransactions)
      .where(
        and(
          eq(giftTransactions.streamId, streamId),
          eq(giftTransactions.senderId, user.id)
        )
      );

    const totalGiftsSent = Number(giftsTotal?.total || 0);

    if (totalGiftsSent >= stream.entryPrice) {
      // Grant access by creating entry payment record
      await db.insert(streamEntryPayments).values({
        streamId: streamId,
        userId: user.id,
        amountPaid: totalGiftsSent,
      });

      return res.json({
        hasAccess: true,
        reason: 'gifts_threshold',
        totalGiftsSent,
      });
    }

    // User doesn't have access
    return res.json({
      hasAccess: false,
      entryPrice: stream.entryPrice,
      totalGiftsSent,
      remaining: stream.entryPrice - totalGiftsSent,
    });
  } catch (error) {
    console.error('❌ Error checking entry access:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check entry access',
    });
  }
}
