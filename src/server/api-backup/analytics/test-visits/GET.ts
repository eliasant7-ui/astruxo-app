import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { siteVisits } from '../../../db/schema.js';
import { desc } from 'drizzle-orm';

/**
 * GET /api/analytics/test-visits
 * Test endpoint to check recent visits
 */
export default async function handler(req: Request, res: Response) {
  try {
    const visits = await db
      .select()
      .from(siteVisits)
      .orderBy(desc(siteVisits.visitedAt))
      .limit(20);
    
    res.json({
      total: visits.length,
      visits: visits.map(v => ({
        page: v.page,
        sessionId: v.sessionId,
        userId: v.userId,
        country: v.country,
        countryCode: v.countryCode,
        visitedAt: v.visitedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
}
