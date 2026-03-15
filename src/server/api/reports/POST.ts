/**
 * POST /api/reports
 * Create a new report
 * Requires authentication
 */

import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { reports } from '../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema.js';

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

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ error: 'Forbidden', message: 'Your account has been banned' });
    }

    const {
      reportedUserId,
      reportedPostId,
      reportedStreamId,
      reason,
      description,
    } = req.body;

    // Validate input
    if (!reason) {
      return res.status(400).json({ error: 'Bad Request', message: 'Reason is required' });
    }

    // At least one target must be specified
    if (!reportedUserId && !reportedPostId && !reportedStreamId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Must specify at least one target (user, post, or stream)',
      });
    }

    // Valid reasons
    const validReasons = ['spam', 'harassment', 'inappropriate', 'violence', 'hate_speech', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid reason',
      });
    }

    // Create report
    const result = await db.insert(reports).values({
      reporterUserId: user.id,
      reportedUserId: reportedUserId || null,
      reportedPostId: reportedPostId || null,
      reportedStreamId: reportedStreamId || null,
      reason,
      description: description || null,
      status: 'pending',
    });

    const reportId = Number(result[0].insertId);

    // Fetch the created report
    const newReport = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    return res.status(201).json({
      success: true,
      report: newReport[0],
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create report',
    });
  }
}
