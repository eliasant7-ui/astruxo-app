/**
 * PUT /api/admin/bootstrap/config
 * Update bootstrap system configuration
 */

import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { bootstrapConfig } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { bootstrapService } from '../../../../services/bootstrap-service.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }

    const {
      isEnabled,
      autoPostingEnabled,
      autoCommentsEnabled,
      streamAnnouncementsEnabled,
      minPostIntervalMinutes,
      maxPostIntervalMinutes,
      commentProbability,
      maxCommentsPerPost,
    } = req.body;

    // Get current config
    const currentConfig = await db.select().from(bootstrapConfig).limit(1);

    if (currentConfig.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Bootstrap config not found' });
    }

    const configId = currentConfig[0].id;

    // Update config
    await db
      .update(bootstrapConfig)
      .set({
        isEnabled: isEnabled !== undefined ? isEnabled : currentConfig[0].isEnabled,
        autoPostingEnabled: autoPostingEnabled !== undefined ? autoPostingEnabled : currentConfig[0].autoPostingEnabled,
        autoCommentsEnabled: autoCommentsEnabled !== undefined ? autoCommentsEnabled : currentConfig[0].autoCommentsEnabled,
        streamAnnouncementsEnabled: streamAnnouncementsEnabled !== undefined ? streamAnnouncementsEnabled : currentConfig[0].streamAnnouncementsEnabled,
        minPostIntervalMinutes: minPostIntervalMinutes !== undefined ? minPostIntervalMinutes : currentConfig[0].minPostIntervalMinutes,
        maxPostIntervalMinutes: maxPostIntervalMinutes !== undefined ? maxPostIntervalMinutes : currentConfig[0].maxPostIntervalMinutes,
        commentProbability: commentProbability !== undefined ? commentProbability : currentConfig[0].commentProbability,
        maxCommentsPerPost: maxCommentsPerPost !== undefined ? maxCommentsPerPost : currentConfig[0].maxCommentsPerPost,
        updatedAt: new Date(),
      })
      .where(eq(bootstrapConfig.id, configId));

    // Restart service if enabled status changed
    if (isEnabled !== undefined && isEnabled !== currentConfig[0].isEnabled) {
      if (isEnabled) {
        await bootstrapService.start();
      } else {
        bootstrapService.stop();
      }
    }

    // Get updated config
    const updatedConfig = await db.select().from(bootstrapConfig).limit(1);

    return res.json({
      success: true,
      message: 'Bootstrap config updated',
      config: updatedConfig[0],
    });
  } catch (error) {
    console.error('Update bootstrap config error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
