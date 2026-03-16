import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { verifyIdToken } from '../services/firebase.js';

export const config = {
  runtime: 'nodejs',
};

function requestMeta(req) {
  return {
    requestId: req.headers['x-vercel-id'] || `local-${Date.now()}`,
    method: req.method,
    path: req.url,
  };
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

export default async function handler(req, res) {
  const meta = requestMeta(req);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use GET' });
  }

  try {
    if (!db) {
      console.error('[AUTH_ME] Database not configured', meta);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Database not configured' });
    }

    const idToken = getBearerToken(req);
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing bearer token' });
    }

    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid Firebase token' });
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userRows.length === 0) {
      console.warn('[AUTH_ME] User not found for Firebase uid', {
        ...meta,
        uid: decodedToken.uid,
      });
      return res.status(404).json({ error: 'Not Found', message: 'User not found in database' });
    }

    return res.status(200).json({ success: true, user: userRows[0] });
  } catch (error) {
    console.error('[AUTH_ME] Unexpected error', {
      ...meta,
      message: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch user' });
  }
}
