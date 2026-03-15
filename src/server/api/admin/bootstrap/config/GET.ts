/**
 * GET /api/admin/bootstrap/config
 * Get bootstrap system configuration
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { bootstrapConfig } from '../../../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }

    const config = await db.select().from(bootstrapConfig).limit(1);

    if (config.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Bootstrap config not found' });
    }

    return res.json(config[0]);
  } catch (error) {
    console.error('Get bootstrap config error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
