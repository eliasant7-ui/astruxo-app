/**
 * GET /api/wallet/balance
 * Get current user's coin and wallet balance
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
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

    // Get user balance
    const user = await db
      .select({
        coinBalance: users.coinBalance,
        walletBalance: users.walletBalance,
      })
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!user[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      balance: {
        coins: user[0].coinBalance,
        wallet: parseFloat(user[0].walletBalance as any),
      },
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch balance' });
  }
}
