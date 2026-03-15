/**
 * GET /api/analytics/connections/count
 * Get total active connections count (public endpoint)
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { activeConnections } from '../../../../db/schema.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Get total connections
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activeConnections);
    const total = totalResult[0]?.count || 0;

    // Get authenticated vs anonymous
    const authenticatedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activeConnections)
      .where(sql`${activeConnections.userId} IS NOT NULL`);
    const authenticated = authenticatedResult[0]?.count || 0;
    const anonymous = total - authenticated;

    res.json({
      total,
      authenticated,
      anonymous,
    });
  } catch (error) {
    console.error('Error fetching connection count:', error);
    res.status(500).json({
      error: 'Failed to fetch connection count',
      message: String(error),
    });
  }
}
