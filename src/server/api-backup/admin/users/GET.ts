/**
 * GET /api/admin/users
 * Get all users (admin only)
 * Query params: search, page, limit, sortBy, sortOrder
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { verifyFirebaseToken } from '../../../middleware/auth.js';
import { eq, like, or, desc, asc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);

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

    const user = userResult[0];

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    // Parse query params
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Apply search filter
    if (search) {
      const allUsers = await db
        .select()
        .from(users)
        .where(
          or(
            like(users.username, `%${search}%`),
            like(users.displayName, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );

      // Apply sorting
      const sortedUsers = allUsers.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a];
        const bVal = b[sortBy as keyof typeof b];
        
        // Handle null values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Apply pagination
      const paginatedUsers = sortedUsers.slice(offset, offset + limit);

      return res.json({
        users: paginatedUsers,
        page,
        limit,
        total: allUsers.length,
        hasMore: offset + limit < allUsers.length,
      });
    }

    // No search - get all users with sorting
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const allUsers = await db
      .select()
      .from(users)
      .orderBy(orderFn(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select().from(users);

    return res.json({
      users: allUsers,
      page,
      limit,
      total: totalResult.length,
      hasMore: allUsers.length === limit,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users',
    });
  }
}
