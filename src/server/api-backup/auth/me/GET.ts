/**
 * GET /api/auth/me
 * Get current authenticated user
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  console.log('🎯 /api/auth/me handler called');
  
  try {
    // Manual authentication since middleware doesn't work in production bundle
    const authHeader = req.headers.authorization;
    console.log('🔍 Authorization header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header or invalid format');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔍 Token received, length:', idToken.length);

    const decodedToken = await verifyFirebaseToken(idToken);

    if (!decodedToken) {
      console.log('❌ Token verification failed');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    console.log('✅ Token verified for Firebase UID:', decodedToken.uid);

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      console.log('❌ User not found in database for Firebase UID:', decodedToken.uid);
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const user = userResult[0];
    console.log('✅ User found:', user.username);

    return res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user',
    });
  }
}
