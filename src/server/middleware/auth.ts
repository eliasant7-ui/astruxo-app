/**
 * Authentication Middleware
 * Verifies Firebase tokens and attaches user to request
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '@/server/services/firebase';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Re-export  for use in API handlers
export { verifyIdToken };

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        firebaseUid: string;
        username: string;
        email: string;
        role: string;
        isSuspended: boolean;
        isBanned: boolean;
      };
    }
  }
}

/**
 * Middleware to verify Firebase token and load user
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  console.log('🎯 authenticateUser middleware called for:', req.method, req.path);
  
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 Auth middleware: Checking authorization header');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔍 Auth middleware: Token received, length:', idToken.length);

    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      console.error('❌ Token verification failed');
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }

    console.log('✅ Token verified for Firebase UID:', decodedToken.uid);

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      console.error('❌ User not found in database for Firebase UID:', decodedToken.uid);
      return res.status(404).json({ error: 'Not Found', message: 'User not found in database' });
    }

    const user = userResult[0];
    console.log('✅ User loaded from database:', user.username);

    // Check if user is banned
    if (user.isBanned) {
      console.error('❌ User is banned:', user.username);
      return res.status(403).json({ error: 'Forbidden', message: 'Your account has been banned' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      username: user.username,
      email: user.email,
      role: user.role,
      isSuspended: user.isSuspended,
      isBanned: user.isBanned,
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Authentication failed' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 optionalAuth middleware called for:', req.method, req.path);
  
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth header:', authHeader ? 'Bearer ' + authHeader.substring(7, 27) + '...' : 'NONE');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 No auth header, skipping authentication');
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('🔐 Token extracted, length:', idToken.length);
    
    const decodedToken = await verifyIdToken(idToken);
    
    console.log('🔐 Token decoded:', decodedToken ? { uid: decodedToken.uid } : 'FAILED');

    if (decodedToken) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, decodedToken.uid))
        .limit(1);

      console.log('🔐 User query result:', userResult.length > 0 ? { id: userResult[0].id, username: userResult[0].username } : 'NOT FOUND');

      if (userResult.length > 0) {
        const user = userResult[0];
        req.user = {
          id: user.id,
          firebaseUid: user.firebaseUid,
          username: user.username,
          email: user.email,
          role: user.role,
          isSuspended: user.isSuspended,
          isBanned: user.isBanned,
        };
        console.log('🔐 User attached to request:', { id: req.user.id, username: req.user.username });
      }
    }

    next();
  } catch (error) {
    console.error('🔐 Optional auth error:', error);
    next();
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }

  next();
}

/**
 * Middleware to check if user is moderator or admin
 */
export function requireModerator(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Moderator access required' });
  }

  next();
}

/**
 * Helper function to check if user has role
 */
export function hasRole(user: Express.Request['user'], role: string): boolean {
  if (!user) return false;
  if (role === 'admin') return user.role === 'admin';
  if (role === 'moderator') return user.role === 'moderator' || user.role === 'admin';
  return true;
}

// Export optionalAuth as optionalAuthMiddleware for clarity
export { optionalAuth as optionalAuthMiddleware };
