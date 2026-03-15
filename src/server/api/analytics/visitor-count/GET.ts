import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { siteVisits } from '../../../db/schema.js';
import { count, countDistinct, sql } from 'drizzle-orm';

/**
 * GET /api/analytics/visitor-count
 * Public endpoint - Get visitor statistics (no auth required)
 */
export default async function handler(req: Request, res: Response) {
  try {
    // Get total visits
    const [totalResult] = await db
      .select({ count: count() })
      .from(siteVisits);
    const totalVisits = totalResult?.count || 0;

    // Get unique visitors (by sessionId)
    const [uniqueResult] = await db
      .select({ count: countDistinct(siteVisits.sessionId) })
      .from(siteVisits);
    const uniqueVisitors = uniqueResult?.count || 0;

    // Get visits today
    const [todayResult] = await db
      .select({ count: count() })
      .from(siteVisits)
      .where(sql`DATE(${siteVisits.visitedAt}) = CURDATE()`);
    const todayVisits = todayResult?.count || 0;

    // Get visits this month
    const [monthResult] = await db
      .select({ count: count() })
      .from(siteVisits)
      .where(sql`YEAR(${siteVisits.visitedAt}) = YEAR(CURDATE()) AND MONTH(${siteVisits.visitedAt}) = MONTH(CURDATE())`);
    const monthVisits = monthResult?.count || 0;

    // Get top countries
    const topCountries = await db
      .select({
        country: siteVisits.country,
        countryCode: siteVisits.countryCode,
        visits: count(),
      })
      .from(siteVisits)
      .where(sql`${siteVisits.country} IS NOT NULL`)
      .groupBy(siteVisits.country, siteVisits.countryCode)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    console.log('👁️ Visitor stats requested:', {
      total: totalVisits,
      unique: uniqueVisitors,
      today: todayVisits,
      month: monthVisits,
      countries: topCountries.length,
    });

    res.json({ 
      totalVisits,
      uniqueVisitors,
      todayVisits,
      monthVisits,
      topCountries: topCountries || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching visitor count:', error);
    res.status(500).json({ error: 'Failed to fetch visitor count' });
  }
}
