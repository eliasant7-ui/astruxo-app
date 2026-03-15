/**
 * POST /api/auth/register
 * Register a new user after Firebase authentication
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { idToken, username, displayName, referredBy } = req.body;

    console.log('📝 Registration request:', {
      hasToken: !!idToken,
      tokenLength: idToken?.length,
      username,
      displayName,
      referredBy,
    });

    // Validate input
    if (!idToken || !username) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'idToken and username are required',
      });
    }

    // Verify Firebase token
    console.log('🔍 Verifying Firebase token...');
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      console.error('❌ Token verification failed');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Firebase token',
      });
    }

    console.log('✅ Token verified for user:', decodedToken.uid);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already registered',
        user: existingUser[0],
      });
    }

    // Check if username is taken
    const usernameCheck = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (usernameCheck.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username already taken',
      });
    }

    // Create user in database
    const result = await db.insert(users).values({
      firebaseUid: decodedToken.uid,
      username: username.toLowerCase().trim(),
      email: decodedToken.email || '',
      displayName: displayName || username,
      avatarUrl: decodedToken.picture || null,
      referredBy: referredBy ? referredBy.toLowerCase().trim() : null,
    });

    console.log('✅ User created with referral:', referredBy || 'none');

    const insertId = Number(result[0].insertId);

    // Fetch the created user
    const newUser = await db.select().from(users).where(eq(users.id, insertId)).limit(1);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
}
