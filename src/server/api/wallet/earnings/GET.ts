/**
 * GET /api/wallet/earnings
 * Get streamer's earnings and gift history
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { giftTransactions, gifts, users, streams } from '../../../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get user from database
    const userResult = await db
      .select({
        id: users.id,
        walletBalance: users.walletBalance,
        coinBalance: users.coinBalance,
      })
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult[0];

    // Get recent gift transactions received
    const recentGifts = await db
      .select({
        id: giftTransactions.id,
        giftName: gifts.name,
        giftIcon: gifts.icon,
        coinAmount: giftTransactions.coinAmount,
        message: giftTransactions.message,
        senderUsername: users.username,
        senderDisplayName: users.displayName,
        senderAvatar: users.avatarUrl,
        streamTitle: streams.title,
        createdAt: giftTransactions.createdAt,
      })
      .from(giftTransactions)
      .innerJoin(gifts, eq(giftTransactions.giftId, gifts.id))
      .innerJoin(users, eq(giftTransactions.senderId, users.id))
      .innerJoin(streams, eq(giftTransactions.streamId, streams.id))
      .where(eq(giftTransactions.receiverId, user.id))
      .orderBy(desc(giftTransactions.createdAt))
      .limit(50);

    // Calculate total earnings from gifts
    const totalGiftsResult = await db
      .select({
        total: sql<number>`SUM(${giftTransactions.coinAmount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(giftTransactions)
      .where(eq(giftTransactions.receiverId, user.id));

    const totalCoinsReceived = totalGiftsResult[0]?.total || 0;
    const totalGiftsReceived = totalGiftsResult[0]?.count || 0;

    res.json({
      success: true,
      earnings: {
        walletBalance: parseFloat(user.walletBalance as any),
        coinBalance: user.coinBalance,
        totalCoinsReceived,
        totalGiftsReceived,
        recentGifts,
      },
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
}
