import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { siteVisits, users } from '../../../db/schema.js';
import { sql, count, countDistinct, eq } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

/**
 * GET /api/analytics/site-stats
 * Get site visit statistics (admin only)
 */
export default async function handler(req: Request, res: Response) {
  try {
    // Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, decodedToken.uid)).limit(1);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get total visits
    const [totalVisitsResult] = await db
      .select({ count: count() })
      .from(siteVisits);
    const totalVisits = totalVisitsResult?.count || 0;

    // Get unique visitors (by sessionId)
    const [uniqueVisitorsResult] = await db
      .select({ count: countDistinct(siteVisits.sessionId) })
      .from(siteVisits);
    const uniqueVisitors = uniqueVisitorsResult?.count || 0;

    // Get visits today
    const [visitsToday] = await db
      .select({ count: count() })
      .from(siteVisits)
      .where(sql`DATE(${siteVisits.visitedAt}) = CURDATE()`);
    const todayVisits = visitsToday?.count || 0;

    // Get visits this week
    const [visitsWeek] = await db
      .select({ count: count() })
      .from(siteVisits)
      .where(sql`YEARWEEK(${siteVisits.visitedAt}, 1) = YEARWEEK(CURDATE(), 1)`);
    const weekVisits = visitsWeek?.count || 0;

    // Get visits this month
    const [visitsMonth] = await db
      .select({ count: count() })
      .from(siteVisits)
      .where(sql`YEAR(${siteVisits.visitedAt}) = YEAR(CURDATE()) AND MONTH(${siteVisits.visitedAt}) = MONTH(CURDATE())`);
    const monthVisits = visitsMonth?.count || 0;

    // Get top pages
    const topPages = await db
      .select({
        page: siteVisits.page,
        visits: count(),
      })
      .from(siteVisits)
      .groupBy(siteVisits.page)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    // Get visits by day (last 30 days)
    const visitsByDay = await db
      .select({
        date: sql<string>`DATE(${siteVisits.visitedAt})`,
        visits: count(),
      })
      .from(siteVisits)
      .where(sql`${siteVisits.visitedAt} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`)
      .groupBy(sql`DATE(${siteVisits.visitedAt})`)
      .orderBy(sql`DATE(${siteVisits.visitedAt}) ASC`);

    // Get authenticated vs anonymous visits
    const [authenticatedVisits] = await db
      .select({ count: count() })
      .from(siteVisits)
      .where(sql`${siteVisits.userId} IS NOT NULL`);
    const authVisits = authenticatedVisits?.count || 0;
    const anonVisits = totalVisits - authVisits;

    const response = {
      totalVisits,
      uniqueVisitors,
      todayVisits,
      weekVisits,
      monthVisits,
      topPages: topPages || [],
      visitsByDay: visitsByDay || [],
      authenticatedVisits: authVisits,
      anonymousVisits: anonVisits,
    };

    console.log('📊 Site stats response:', {
      totalVisits,
      uniqueVisitors,
      topPagesCount: topPages.length,
      visitsByDayCount: visitsByDay.length,
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching site stats:', error);
    res.status(500).json({ error: 'Failed to fetch site statistics' });
  }
}
