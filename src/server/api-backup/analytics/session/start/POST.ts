/**
 * Start Session Tracking
 * POST /api/analytics/session/start
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { userSessions, users } from '../../../../db/schema.js';
import { verifyFirebaseToken } from '../../../../services/firebase.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Get session data from request
    const { sessionId, deviceType, country, city, userAgent } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Get IP address
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'Unknown';

    // Create session record
    await db.insert(userSessions).values({
      userId: user.id,
      sessionId,
      ipAddress,
      country: country || 'Unknown',
      city: city || 'Unknown',
      deviceType: deviceType || 'desktop',
      userAgent: userAgent || req.headers['user-agent'] || 'Unknown',
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
    });

    console.log('✅ Session started:', {
      userId: user.id,
      username: user.username,
      sessionId,
      deviceType,
      country,
      city,
    });

    res.json({ success: true, message: 'Session started' });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
}
