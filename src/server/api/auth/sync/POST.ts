/**
 * POST /api/auth/sync
 * Sync current Firebase user to local database
 * Temporary endpoint to fix users created before backend sync was working
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  console.log('🎯 SYNC USER HANDLER CALLED');
  console.log('🔍 Authorization header:', req.headers.authorization);
  
  try {
    // Manual authentication from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔍 Token received, length:', idToken.length);

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      console.log('❌ Token verification failed');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Firebase token',
      });
    }

    console.log('✅ Token verified for Firebase UID:', decodedToken.uid);

    const { username, displayName } = req.body;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ User already exists in database');
      return res.status(200).json({
        success: true,
        message: 'User already synced',
        user: existingUser[0],
      });
    }

    console.log('📝 Creating new user in database...');
    // Create user in database
    const result = await db.insert(users).values({
      firebaseUid: decodedToken.uid,
      username: username || decodedToken.email?.split('@')[0] || 'user',
      email: decodedToken.email || '',
      displayName: displayName || decodedToken.email?.split('@')[0] || 'User',
      avatarUrl: decodedToken.picture || null,
    });

    const insertId = Number(result[0].insertId);

    // Fetch the created user
    const newUser = await db.select().from(users).where(eq(users.id, insertId)).limit(1);

    console.log('✅ User created successfully:', newUser[0].username);
    return res.status(201).json({
      success: true,
      message: 'User synced successfully',
      user: newUser[0],
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
