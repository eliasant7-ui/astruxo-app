/**
 * POST /api/gifts/send
 * Send a gift to a streamer
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { gifts, giftTransactions, coinTransactions, users, streams, privateStreamAccess } from '../../../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!userResult[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const authUserId = userResult[0].id;

    const { giftId, streamId, message } = req.body;

    if (!giftId || !streamId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get sender user (already fetched above)
    const sender = userResult[0];

    // Get gift details
    const gift = await db.select().from(gifts).where(eq(gifts.id, giftId)).limit(1);
    if (!gift[0] || !gift[0].isActive) {
      return res.status(404).json({ success: false, message: 'Gift not found or inactive' });
    }

    // Get stream and receiver
    const stream = await db.select().from(streams).where(eq(streams.id, streamId)).limit(1);
    if (!stream[0]) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    if (stream[0].status !== 'live') {
      return res.status(400).json({ success: false, message: 'Stream is not live' });
    }

    const receiverId = stream[0].userId;

    // Check if sender has enough coins
    if (sender.coinBalance < gift[0].coinPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins',
        required: gift[0].coinPrice,
        current: sender.coinBalance,
      });
    }

    // Perform transaction
    // 1. Deduct coins from sender
    await db
      .update(users)
      .set({
        coinBalance: sql`${users.coinBalance} - ${gift[0].coinPrice}`,
      })
      .where(eq(users.id, authUserId));

    // 2. Add coins to receiver's wallet (convert to money at 1 coin = $0.01)
    const moneyEarned = (gift[0].coinPrice * 0.01).toFixed(2);
    await db
      .update(users)
      .set({
        walletBalance: sql`${users.walletBalance} + ${moneyEarned}`,
      })
      .where(eq(users.id, receiverId));

    // 3. Update stream total gifts and goal progress
    await db
      .update(streams)
      .set({
        totalGiftsReceived: sql`${streams.totalGiftsReceived} + ${moneyEarned}`,
        currentGoalProgress: sql`${streams.currentGoalProgress} + ${gift[0].coinPrice}`,
      })
      .where(eq(streams.id, streamId));

    // 4. Create gift transaction record
    const giftTxResult = await db.insert(giftTransactions).values({
      giftId: giftId,
      senderId: authUserId,
      receiverId: receiverId,
      streamId: streamId,
      coinAmount: gift[0].coinPrice,
      message: message || null,
    });

    const giftTxId = Number(giftTxResult[0].insertId);

    // 5. Create coin transaction records
    await db.insert(coinTransactions).values([
      {
        userId: authUserId,
        amount: -gift[0].coinPrice,
        type: 'gift_sent',
        description: `Sent ${gift[0].name} to stream`,
        referenceId: giftTxId,
      },
      {
        userId: receiverId,
        amount: gift[0].coinPrice,
        type: 'gift_received',
        description: `Received ${gift[0].name} from viewer`,
        referenceId: giftTxId,
      },
    ]);

    // 6. Grant access to private stream if this is the required gift OR if cumulative gifts >= entry price
    let grantedPrivateAccess = false;
    
    // Check for gift-gated private stream
    if (stream[0].isPrivate && stream[0].requiredGiftId === giftId) {
      // Check if user already has access
      const [existingAccess] = await db
        .select()
        .from(privateStreamAccess)
        .where(
          and(
            eq(privateStreamAccess.streamId, streamId),
            eq(privateStreamAccess.userId, authUserId)
          )
        )
        .limit(1);

      if (!existingAccess) {
        await db.insert(privateStreamAccess).values({
          streamId: streamId,
          userId: authUserId,
          giftId: giftId,
        });
        grantedPrivateAccess = true;
      }
    }
    
    // Check for entry price stream - grant access if cumulative gifts >= entry price
    if (stream[0].entryPrice && stream[0].entryPrice > 0) {
      // Calculate total gifts sent by this user in this stream
      const totalGiftsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${giftTransactions.coinAmount}), 0)`,
        })
        .from(giftTransactions)
        .where(
          and(
            eq(giftTransactions.streamId, streamId),
            eq(giftTransactions.senderId, authUserId)
          )
        );
      
      const totalGiftsSent = Number(totalGiftsResult[0]?.total || 0);
      console.log(`💰 User ${authUserId} has sent ${totalGiftsSent} coins total in stream ${streamId} (entry price: ${stream[0].entryPrice})`);
      
      // If total gifts >= entry price, grant access
      if (totalGiftsSent >= stream[0].entryPrice) {
        // Check if user already has access
        const [existingAccess] = await db
          .select()
          .from(privateStreamAccess)
          .where(
            and(
              eq(privateStreamAccess.streamId, streamId),
              eq(privateStreamAccess.userId, authUserId)
            )
          )
          .limit(1);

        if (!existingAccess) {
          await db.insert(privateStreamAccess).values({
            streamId: streamId,
            userId: authUserId,
            giftId: null, // No specific gift required, just entry price
          });
          grantedPrivateAccess = true;
          console.log(`✅ Granted entry access to user ${authUserId} for stream ${streamId}`);
        }
      }
    }

    // Get updated sender balance
    const updatedSender = await db.select().from(users).where(eq(users.id, authUserId)).limit(1);

    res.json({
      success: true,
      message: grantedPrivateAccess ? 'Gift sent! You now have access to this private stream' : 'Gift sent successfully',
      transaction: {
        id: giftTxId,
        gift: gift[0],
        coinAmount: gift[0].coinPrice,
        newBalance: updatedSender[0].coinBalance,
      },
      grantedPrivateAccess,
    });
  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({ success: false, message: 'Failed to send gift' });
  }
}
