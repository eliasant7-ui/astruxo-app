/**
 * PUT /api/users/:userId
 * Update user profile (own profile only)
 * Uses inline authentication (no middleware dependency)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Inline authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    console.log('🔐 Verifying token for profile update...');

    let firebaseUid: string;
    try {
      const decodedToken = await verifyFirebaseToken(token);
      if (!decodedToken) {
        throw new Error('Token verification returned null');
      }
      firebaseUid = decodedToken.uid;
      console.log('✅ Token verified, Firebase UID:', firebaseUid);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Get authenticated user from database
    const authenticatedUser = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    if (!authenticatedUser.length) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const currentUser = authenticatedUser[0];
    console.log('✅ Authenticated user:', currentUser.id, currentUser.username);

    // Parse and validate userId parameter - support numeric ID, Firebase UID, or username
    const userIdParam = req.params.userId;
    const numericId = parseInt(userIdParam);
    const isNumericOnly = /^\d+$/.test(userIdParam);
    let targetUserResult;
    let userId: number;

    if (!isNaN(numericId) && isNumericOnly) {
      // Lookup by database ID (only if entire string is numeric)
      targetUserResult = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      // Lookup by Firebase UID or username
      targetUserResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, userIdParam))
        .limit(1);
      
      // If not found by UID, try username
      if (targetUserResult.length === 0) {
        targetUserResult = await db
          .select()
          .from(users)
          .where(eq(users.username, userIdParam))
          .limit(1);
      }
    }

    if (targetUserResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    userId = targetUserResult[0].id;

    // Check if user is updating their own profile
    if (currentUser.id !== userId) {
      console.log(`❌ User ${currentUser.id} tried to update user ${userId}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    console.log('✅ Authorization check passed')

    const { displayName, bio, avatarUrl } = req.body;

    // Build update object
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
      });
    }

    // Update user
    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Fetch updated user
    const updatedUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile',
    });
  }
}
