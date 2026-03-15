/**
 * DELETE /api/users/:userId
 * Delete user account (own account only)
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users, streams, follows, chatMessages, giftTransactions, coinTransactions } from '../../../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../services/firebase.js';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req: Request, res: Response) {
  console.log('🎯 DELETE /api/users/:userId handler called');
  
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
      console.log('❌ User not found in database');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const authenticatedUser = userResult[0];
    console.log('✅ Authenticated user:', authenticatedUser.username);

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

    // Check if user is deleting their own account
    if (authenticatedUser.id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own account',
      });
    }

    const { deleteFirebaseAccount } = req.body;

    console.log(`🗑️ Deleting user account: ${userId}`);

    // Delete related data in order (respecting foreign key constraints)
    
    // 1. Delete gift transactions (sent and received)
    await db.delete(giftTransactions)
      .where(or(
        eq(giftTransactions.senderId, userId),
        eq(giftTransactions.receiverId, userId)
      ));
    console.log('✅ Deleted gift transactions');

    // 2. Delete coin transactions
    await db.delete(coinTransactions).where(eq(coinTransactions.userId, userId));
    console.log('✅ Deleted coin transactions');

    // 3. Delete chat messages
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    console.log('✅ Deleted chat messages');

    // 4. Delete follows (as follower and following)
    await db.delete(follows)
      .where(or(
        eq(follows.followerId, userId),
        eq(follows.followingId, userId)
      ));
    console.log('✅ Deleted follows');

    // 5. Delete streams
    await db.delete(streams).where(eq(streams.userId, userId));
    console.log('✅ Deleted streams');

    // 6. Delete user profile
    await db.delete(users).where(eq(users.id, userId));
    console.log('✅ Deleted user profile');

    // 7. Optionally delete Firebase account
    if (deleteFirebaseAccount && authenticatedUser.firebaseUid) {
      try {
        const auth = getAuth();
        await auth.deleteUser(authenticatedUser.firebaseUid);
        console.log('✅ Deleted Firebase account');
      } catch (firebaseError) {
        console.error('⚠️ Failed to delete Firebase account:', firebaseError);
        // Continue anyway - database is already cleaned up
      }
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete account',
    });
  }
}
