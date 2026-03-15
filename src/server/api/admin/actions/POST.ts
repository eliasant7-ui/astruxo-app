/**
 * POST /api/admin/actions
 * Perform admin actions (ban, suspend, delete, restore)
 * Admin only
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users, posts, moderationLogs } from '../../../db/schema.js';
import { verifyIdToken } from '@/server/services/firebase';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

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

    const admin = userResult[0];

    // Check if user is admin
    if (admin.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    const { actionType, targetUserId, targetPostId, reason } = req.body;

    // Validate action type
    const validActions = [
      'ban_user',
      'unban_user',
      'suspend_user',
      'unsuspend_user',
      'delete_post',
      'restore_post',
    ];

    if (!actionType || !validActions.includes(actionType)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid action type',
      });
    }

    // Validate targets
    if (
      (actionType.includes('user') && !targetUserId) ||
      (actionType.includes('post') && !targetPostId)
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Target ID required for this action',
      });
    }

    // Perform action
    let actionResult;

    switch (actionType) {
      case 'ban_user':
        // Check if target user exists
        const userToBan = await db
          .select()
          .from(users)
          .where(eq(users.id, targetUserId))
          .limit(1);

        if (userToBan.length === 0) {
          return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }

        // Prevent banning admins
        if (userToBan[0].role === 'admin') {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Cannot ban admin users',
          });
        }

        await db.update(users).set({ isBanned: true }).where(eq(users.id, targetUserId));
        actionResult = { success: true, message: 'User banned successfully' };
        break;

      case 'unban_user':
        await db.update(users).set({ isBanned: false }).where(eq(users.id, targetUserId));
        actionResult = { success: true, message: 'User unbanned successfully' };
        break;

      case 'suspend_user':
        const userToSuspend = await db
          .select()
          .from(users)
          .where(eq(users.id, targetUserId))
          .limit(1);

        if (userToSuspend.length === 0) {
          return res.status(404).json({ error: 'Not Found', message: 'User not found' });
        }

        // Prevent suspending admins
        if (userToSuspend[0].role === 'admin') {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Cannot suspend admin users',
          });
        }

        await db.update(users).set({ isSuspended: true }).where(eq(users.id, targetUserId));
        actionResult = { success: true, message: 'User suspended successfully' };
        break;

      case 'unsuspend_user':
        await db.update(users).set({ isSuspended: false }).where(eq(users.id, targetUserId));
        actionResult = { success: true, message: 'User unsuspended successfully' };
        break;

      case 'delete_post':
        // Check if post exists
        const postToDelete = await db
          .select()
          .from(posts)
          .where(eq(posts.id, targetPostId))
          .limit(1);

        if (postToDelete.length === 0) {
          return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
        }

        // Soft delete by updating a flag (you can add isDeleted field to posts table)
        // For now, we'll actually delete it
        await db.delete(posts).where(eq(posts.id, targetPostId));
        actionResult = { success: true, message: 'Post deleted successfully' };
        break;

      case 'restore_post':
        // This would restore a soft-deleted post
        // Implementation depends on soft delete strategy
        actionResult = { success: true, message: 'Post restore not implemented yet' };
        break;

      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Unknown action type',
        });
    }

    // Log the action
    await db.insert(moderationLogs).values({
      adminId: admin.id,
      actionType,
      targetUserId: targetUserId || null,
      targetPostId: targetPostId || null,
      reason: reason || null,
    });

    return res.json(actionResult);
  } catch (error) {
    console.error('Error performing admin action:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to perform action',
    });
  }
}
