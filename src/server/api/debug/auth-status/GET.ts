/**
 * GET /api/debug/auth-status
 * Debug endpoint to check authentication status
 */

import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    
    res.json({
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : null,
      hasUser: !!req.user,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        isSuspended: req.user.isSuspended,
        isBanned: req.user.isBanned,
      } : null,
    });
  } catch (error) {
    console.error('Error in auth-status:', error);
    res.status(500).json({
      error: 'Failed to check auth status',
      message: String(error),
    });
  }
}
