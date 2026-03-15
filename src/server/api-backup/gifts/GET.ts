/**
 * GET /api/gifts
 * Get all active gifts from catalog
 */

import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { gifts } from '../../db/schema.js';
import { eq, asc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Get all active gifts, sorted by sortOrder
    const activeGifts = await db
      .select({
        id: gifts.id,
        name: gifts.name,
        icon: gifts.icon,
        coinPrice: gifts.coinPrice,
        animationType: gifts.animationType,
        sortOrder: gifts.sortOrder,
      })
      .from(gifts)
      .where(eq(gifts.isActive, true))
      .orderBy(asc(gifts.sortOrder));

    res.json({
      success: true,
      gifts: activeGifts,
    });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gifts' });
  }
}
