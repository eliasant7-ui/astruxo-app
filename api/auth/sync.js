import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { ensureCoreTables } from '../db/bootstrap.js';
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

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

function normalizeUsername(input) {
  const cleaned = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);

  return cleaned || `user${Date.now().toString().slice(-6)}`;
}

async function findUniqueUsername(baseUsername) {
  let candidate = normalizeUsername(baseUsername);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);

    if (existing.length === 0) {
      return candidate;
    }

    const suffix = `${Math.floor(Math.random() * 9000) + 1000}`;
    const trimmedBase = candidate.slice(0, Math.max(1, 30 - suffix.length - 1));
    candidate = `${trimmedBase}_${suffix}`;
  }

  return `user_${Date.now().toString().slice(-8)}`;
}

export default async function handler(req, res) {
  const meta = requestMeta(req);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
  }

  try {
    if (!db) {
      console.error('[AUTH_SYNC] Database not configured', meta);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Database not configured' });
    }

    await ensureCoreTables();

    const idToken = getBearerToken(req);
    const body = parseBody(req);

    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing bearer token' });
    }

    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid Firebase token' });
    }

    console.log('[AUTH_SYNC] Token verified', {
      ...meta,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    });

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'User already synced',
        user: existingUser[0],
      });
    }

    const email = decodedToken.email || String(body.email || '').trim();
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email missing from Firebase token' });
    }

    const rawUsername = body.username || email.split('@')[0] || `user${Date.now().toString().slice(-5)}`;
    const username = await findUniqueUsername(rawUsername);
    const displayName = String(body.displayName || username).trim();

    const createdUsers = await db
      .insert(users)
      .values({
        firebaseUid: decodedToken.uid,
        username,
        email,
        displayName,
        avatarUrl: decodedToken.picture || null,
      })
      .returning();

    const createdUser = createdUsers[0];

    console.log('[AUTH_SYNC] User created', {
      ...meta,
      userId: createdUser?.id,
      username: createdUser?.username,
    });

    return res.status(201).json({
      success: true,
      message: 'User synced successfully',
      user: createdUser,
    });
  } catch (error) {
    console.error('[AUTH_SYNC] Unexpected error', {
      ...meta,
      message: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync user',
    });
  }
}
