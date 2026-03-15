import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { userSessions } from '../../../../db/schema.js';
import { v4 as uuidv4 } from 'uuid';

export default async function POST(req: Request, res: Response) {
  try {
    const { sessionId, deviceType, country, city } = req.body;
    
    const userId = (req as any).user?.id || null;
    
    const [session] = await db.insert(userSessions).values({
      sessionId: sessionId || uuidv4(),
      userId: userId,
      deviceType: deviceType || 'unknown',
      ipAddress: req.ip || req.socket.remoteAddress,
      country: country || null,
      city: city || null,
      startedAt: new Date(),
      lastActivity: new Date(),
    }).returning();

    return res.status(200).json({ 
      success: true, 
      sessionId: session.sessionId 
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
