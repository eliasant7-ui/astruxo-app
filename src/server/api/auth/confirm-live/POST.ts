/**
 * POST /api/auth/confirm-live
 * Save user's pre-live confirmation (age + guidelines)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    console.log('🔄 Confirm live endpoint called');
    
    // Inline authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const currentUser = userResult[0];

    // Update liveConfirmedAt timestamp
    await db
      .update(users)
      .set({ liveConfirmedAt: new Date() })
      .where(eq(users.id, currentUser.id));

    console.log('✅ Live confirmation saved for user:', currentUser.username);

    return res.json({
      success: true,
      message: 'Pre-live confirmation saved',
    });
  } catch (error) {
    console.error('Confirm live error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save confirmation',
    });
  }
}
