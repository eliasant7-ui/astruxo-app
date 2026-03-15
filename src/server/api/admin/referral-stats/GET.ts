/**
 * GET /api/admin/referral-stats
 * Get referral statistics (admin only)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq, isNotNull, sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Authenticate user
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Load user from database
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

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    // Get referral statistics
    const stats = await db
      .select({
        referredBy: users.referredBy,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(isNotNull(users.referredBy))
      .groupBy(users.referredBy)
      .orderBy(sql`COUNT(*) DESC`);

    // Get total referred users
    const totalResult = await db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(isNotNull(users.referredBy));

    const totalReferred = totalResult[0]?.total || 0;

    console.log('📊 Referral stats:', { totalReferred, uniqueReferrers: stats.length });

    return res.json({
      success: true,
      stats,
      totalReferred,
    });
  } catch (error) {
    console.error('❌ Referral stats error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch referral statistics',
    });
  }
}
