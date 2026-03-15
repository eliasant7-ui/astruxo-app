/**
 * GET /api/reports
 * Get all reports (admin/moderator only)
 * Query params: status, page, limit
 */

import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { reports, users } from '../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const user = userResult[0];

    // Check if user is moderator or admin
    if (user.role !== 'moderator' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Moderator or admin access required',
      });
    }

    // Parse query params
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = db
      .select({
        report: reports,
        reporter: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterUserId, users.id))
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter by status if provided
    if (status) {
      const reportsWithStatus = await db
        .select({
          report: reports,
          reporter: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterUserId, users.id))
        .where(eq(reports.status, status))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset);

      return res.json({
        reports: reportsWithStatus,
        page,
        limit,
        hasMore: reportsWithStatus.length === limit,
      });
    }

    const allReports = await query;

    return res.json({
      reports: allReports,
      page,
      limit,
      hasMore: allReports.length === limit,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reports',
    });
  }
}
