/**
 * POST /api/streams/:streamId/pay-entry
 * Pay entry price to access a paid stream
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { streams, streamEntryPayments, users, coinTransactions } from '../../../../db/schema.js';
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

    if (!stream.entryPrice) {
      return res.status(400).json({ error: 'This stream does not require entry payment' });
    }

    // Check if user already has access
    const [existingPayment] = await db
      .select()
      .from(streamEntryPayments)
      .where(
        and(
          eq(streamEntryPayments.streamId, streamId),
          eq(streamEntryPayments.userId, user.id)
        )
      )
      .limit(1);

    if (existingPayment) {
      return res.status(400).json({ error: 'You already have access to this stream' });
    }

    // Check if user has enough coins
    if (user.coinBalance < stream.entryPrice) {
      return res.status(400).json({
        error: 'Insufficient coins',
        required: stream.entryPrice,
        current: user.coinBalance,
        needed: stream.entryPrice - user.coinBalance,
      });
    }

    // Get broadcaster
    const [broadcaster] = await db
      .select()
      .from(users)
      .where(eq(users.id, stream.userId))
      .limit(1);

    if (!broadcaster) {
      return res.status(404).json({ error: 'Broadcaster not found' });
    }

    // Process payment
    // 1. Deduct coins from viewer
    await db
      .update(users)
      .set({
        coinBalance: sql`${users.coinBalance} - ${stream.entryPrice}`,
      })
      .where(eq(users.id, user.id));

    // 2. Add money to broadcaster's wallet (1 coin = $0.01)
    const moneyEarned = (stream.entryPrice * 0.01).toFixed(2);
    await db
      .update(users)
      .set({
        walletBalance: sql`${users.walletBalance} + ${moneyEarned}`,
      })
      .where(eq(users.id, broadcaster.id));

    // 3. Create entry payment record
    const entryResult = await db.insert(streamEntryPayments).values({
      streamId: streamId,
      userId: user.id,
      amountPaid: stream.entryPrice,
    });

    const entryId = Number(entryResult[0].insertId);

    // 4. Create coin transaction records
    await db.insert(coinTransactions).values([
      {
        userId: user.id,
        amount: -stream.entryPrice,
        type: 'stream_entry',
        description: `Paid entry to stream: ${stream.title}`,
        referenceId: entryId,
      },
      {
        userId: broadcaster.id,
        amount: stream.entryPrice,
        type: 'stream_entry_received',
        description: `Entry payment received from viewer`,
        referenceId: entryId,
      },
    ]);

    // Get updated balance
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return res.json({
      success: true,
      message: 'Entry paid successfully! You now have access to this stream',
      payment: {
        id: entryId,
        amountPaid: stream.entryPrice,
        newBalance: updatedUser.coinBalance,
      },
    });
  } catch (error) {
    console.error('❌ Error paying entry:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process entry payment',
    });
  }
}
