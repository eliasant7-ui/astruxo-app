/**
 * POST /api/admin/clear-analytics
 * Clear all analytics data (sessions, connections)
 * Admin only
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { userSessions, activeConnections } from '../../../db/schema.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Inline authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Import Firebase Admin for token verification
    const { verifyFirebaseToken } = await import('../../../services/firebase.js');
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database to check admin status
    const { users } = await import('../../../db/schema.js');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('🧹 Clearing all analytics data...');

    // Delete all user sessions
    const sessionsDeleted = await db.delete(userSessions);
    console.log('✅ Deleted user sessions');

    // Delete all active connections
    const connectionsDeleted = await db.delete(activeConnections);
    console.log('✅ Deleted active connections');

    // Reset auto-increment counters (optional)
    await db.execute(sql`ALTER TABLE user_sessions AUTO_INCREMENT = 1`);
    await db.execute(sql`ALTER TABLE active_connections AUTO_INCREMENT = 1`);
    console.log('✅ Reset auto-increment counters');

    res.json({
      success: true,
      message: 'All analytics data cleared successfully',
      deleted: {
        sessions: 'all',
        connections: 'all',
      },
    });
  } catch (error) {
    console.error('❌ Error clearing analytics:', error);
    res.status(500).json({
      error: 'Failed to clear analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
