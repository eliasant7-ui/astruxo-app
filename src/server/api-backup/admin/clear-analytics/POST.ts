/**
 * POST /api/admin/clear-analytics
 * Clear all analytics data (sessions, connections)
 * Admin only
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { sql, eq } from 'drizzle-orm';
import { users } from '../../../db/schema.js';
import { verifyIdToken } from '../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.slice(7);
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('[ADMIN_CLEAR_ANALYTICS] Truncating analytics tables');
    await db.execute(sql`TRUNCATE TABLE user_sessions, active_connections RESTART IDENTITY`);

    return res.json({
      success: true,
      message: 'All analytics data cleared successfully',
      deleted: {
        sessions: 'all',
        connections: 'all',
      },
    });
  } catch (error) {
    console.error('[ADMIN_CLEAR_ANALYTICS] Error:', error);
    return res.status(500).json({
      error: 'Failed to clear analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
