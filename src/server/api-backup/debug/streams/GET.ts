import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams } from '../../../db/schema.js';
import { desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const recentStreams = await db
      .select({
        id: streams.id,
        title: streams.title,
        goalAmount: streams.goalAmount,
        currentGoalProgress: streams.currentGoalProgress,
        entryPrice: streams.entryPrice,
        status: streams.status,
      })
      .from(streams)
      .orderBy(desc(streams.id))
      .limit(5);

    return res.json({ streams: recentStreams });
  } catch (error) {
    console.error('Debug streams error:', error);
    return res.status(500).json({ error: 'Failed to fetch streams' });
  }
}
