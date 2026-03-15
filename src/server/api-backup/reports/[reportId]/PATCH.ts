/**
 * PATCH /api/reports/:reportId
 * Update report status (admin/moderator only)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { reports, users } from '../../../db/schema.js';
import { verifyFirebaseToken } from '../../../middleware/auth.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);

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

    const reportId = parseInt(req.params.reportId);
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'dismissed', 'action_taken'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status',
      });
    }

    // Check if report exists
    const existingReport = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (existingReport.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Report not found' });
    }

    // Update report
    await db
      .update(reports)
      .set({
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      })
      .where(eq(reports.id, reportId));

    // Fetch updated report
    const updatedReport = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    return res.json({
      success: true,
      report: updatedReport[0],
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update report',
    });
  }
}
