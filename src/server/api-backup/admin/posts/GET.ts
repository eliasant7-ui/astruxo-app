/**
 * GET /api/admin/posts
 * Get all posts (admin only)
 * Query params: search, page, limit, sortBy, sortOrder
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { posts, users } from '../../../db/schema.js';
import { verifyFirebaseToken } from '../../../middleware/auth.js';
import { eq, like, desc, asc } from 'drizzle-orm';

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
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build query with user info
    const orderFn = sortOrder === 'asc' ? asc : desc;

    let allPosts;

    if (search) {
      // Search in content
      allPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(like(posts.content, `%${search}%`))
        .orderBy(orderFn(posts.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      allPosts = await db
        .select({
          post: posts,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .orderBy(orderFn(posts.createdAt))
        .limit(limit)
        .offset(offset);
    }

    // Get total count
    const totalResult = await db.select().from(posts);

    return res.json({
      posts: allPosts,
      page,
      limit,
      total: totalResult.length,
      hasMore: allPosts.length === limit,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch posts',
    });
  }
}
