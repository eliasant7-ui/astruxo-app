import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { userSessions } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function POST(req: Request, res: Response) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }

    await db.update(userSessions)
      .set({ endedAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
