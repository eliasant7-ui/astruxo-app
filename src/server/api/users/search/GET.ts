/**
 * GET /api/users/search
 * Search users by username or display name
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { like, or, sql } from 'drizzle-orm';
import { optionalAuth } from '../../../middleware/auth.js';

export const middleware = [optionalAuth];

export default async function handler(req: Request, res: Response) {
  try {
    console.log('🔍 User search endpoint called');
    console.log('🔍 Query params:', req.query);
    
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      console.log('❌ No search query provided');
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    console.log('🔍 Searching users with query:', q);

    // Search by username or display name (case-insensitive)
    const searchPattern = `%${q}%`;
    
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        followerCount: users.followerCount,
        isLive: users.isLive,
      })
      .from(users)
      .where(
        or(
          sql`LOWER(${users.username}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(COALESCE(${users.displayName}, '')) LIKE LOWER(${searchPattern})`
        )
      )
      .orderBy(sql`${users.followerCount} DESC`)
      .limit(10);

    console.log('✅ Found users:', results.length);
    console.log('📋 Results:', results.map(u => ({ id: u.id, username: u.username })));

    return res.json({
      success: true,
      users: results,
    });
  } catch (error) {
    console.error('❌ User search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search users',
      message: String(error),
    });
  }
}
