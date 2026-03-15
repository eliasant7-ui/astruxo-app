/**
 * GET /api/admin/bootstrap/stats
 * Get bootstrap system statistics
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { botAccounts, activityLog, users } from '../../../../db/schema.js';
import { eq, sql, gte } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }

    // Get bot accounts with user info
    const bots = await db
      .select({
        id: botAccounts.id,
        botType: botAccounts.botType,
        isActive: botAccounts.isActive,
        postFrequencyMinutes: botAccounts.postFrequencyMinutes,
        lastPostedAt: botAccounts.lastPostedAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(botAccounts)
      .innerJoin(users, eq(botAccounts.userId, users.id));

    // Get activity stats for last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentActivity = await db
      .select({
        activityType: activityLog.activityType,
        count: sql<number>`COUNT(*)`,
      })
      .from(activityLog)
      .where(gte(activityLog.createdAt, oneDayAgo))
      .groupBy(activityLog.activityType);

    // Get total activity counts
    const totalActivity = await db
      .select({
        activityType: activityLog.activityType,
        count: sql<number>`COUNT(*)`,
      })
      .from(activityLog)
      .groupBy(activityLog.activityType);

    // Get success rate
    const successStats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`SUM(CASE WHEN ${activityLog.success} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(activityLog);

    const stats = {
      bots: bots,
      recentActivity: recentActivity.reduce((acc, item) => {
        acc[item.activityType] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
      totalActivity: totalActivity.reduce((acc, item) => {
        acc[item.activityType] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
      successRate: successStats[0] ? {
        total: Number(successStats[0].total),
        successful: Number(successStats[0].successful),
        percentage: successStats[0].total > 0 
          ? ((Number(successStats[0].successful) / Number(successStats[0].total)) * 100).toFixed(2)
          : '0',
      } : { total: 0, successful: 0, percentage: '0' },
    };

    return res.json(stats);
  } catch (error) {
    console.error('Get bootstrap stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
