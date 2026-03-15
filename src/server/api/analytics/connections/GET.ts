/**
 * GET /api/analytics/connections
 * Get active connections statistics
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { activeConnections, users } from '../../../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }

    // Get total connections
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activeConnections);
    const totalConnections = totalResult[0]?.count || 0;

    // Get authenticated vs anonymous
    const authenticatedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activeConnections)
      .where(sql`${activeConnections.userId} IS NOT NULL`);
    const authenticatedConnections = authenticatedResult[0]?.count || 0;
    const anonymousConnections = totalConnections - authenticatedConnections;

    // Get connections by country
    const byCountry = await db
      .select({
        country: activeConnections.country,
        count: sql<number>`count(*)`,
      })
      .from(activeConnections)
      .where(sql`${activeConnections.country} IS NOT NULL`)
      .groupBy(activeConnections.country)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Get connections by city
    const byCity = await db
      .select({
        city: activeConnections.city,
        country: activeConnections.country,
        count: sql<number>`count(*)`,
      })
      .from(activeConnections)
      .where(sql`${activeConnections.city} IS NOT NULL`)
      .groupBy(activeConnections.city, activeConnections.country)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Get recent connections with user info
    const recentConnections = await db
      .select({
        id: activeConnections.id,
        socketId: activeConnections.socketId,
        userId: activeConnections.userId,
        username: users.username,
        displayName: users.displayName,
        country: activeConnections.country,
        city: activeConnections.city,
        region: activeConnections.region,
        latitude: activeConnections.latitude,
        longitude: activeConnections.longitude,
        connectedAt: activeConnections.connectedAt,
        lastSeenAt: activeConnections.lastSeenAt,
      })
      .from(activeConnections)
      .leftJoin(users, eq(activeConnections.userId, users.id))
      .orderBy(desc(activeConnections.connectedAt))
      .limit(50);

    res.json({
      summary: {
        total: totalConnections,
        authenticated: authenticatedConnections,
        anonymous: anonymousConnections,
      },
      byCountry,
      byCity,
      recentConnections,
    });
  } catch (error) {
    console.error('Error fetching connection analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch connection analytics',
      message: String(error),
    });
  }
}
