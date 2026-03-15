import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const streamId = req.query.id as string;
    
    if (!streamId) {
      return res.status(400).json({ error: 'Stream ID required' });
    }

    const stream = await db
      .select()
      .from(streams)
      .where(eq(streams.id, parseInt(streamId)))
      .limit(1);

    if (stream.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    return res.json({
      id: stream[0].id,
      title: stream[0].title,
      goalAmount: stream[0].goalAmount,
      entryPrice: stream[0].entryPrice,
      currentGoalProgress: stream[0].currentGoalProgress,
    });
  } catch (error) {
    console.error('Debug stream error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
