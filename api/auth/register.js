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

function normalizeUsername(username) {
  return String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

export default async function handler(req, res) {
  const meta = requestMeta(req);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST' });
  }

  try {
    if (!db) {
      console.error('[AUTH_REGISTER] Database not configured', meta);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Database not configured' });
    }

    await ensureCoreTables();

    const body = parseBody(req);
    const idToken = body.idToken || getBearerToken(req);
    const username = normalizeUsername(body.username);
    const displayName = String(body.displayName || body.username || '').trim();
    const referredBy = body.referredBy ? String(body.referredBy).trim().toLowerCase() : null;

    console.log('[AUTH_REGISTER] Incoming request', {
      ...meta,
      hasToken: Boolean(idToken),
      username,
      hasDisplayName: Boolean(displayName),
      hasReferral: Boolean(referredBy),
    });

    if (!idToken) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing Firebase idToken' });
    }

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Bad Request', message: 'Username must be at least 3 characters' });
    }

    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid Firebase token' });
    }

    console.log('[AUTH_REGISTER] Token verified', {
      ...meta,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    });

    const existingByUid = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (existingByUid.length > 0) {
      console.log('[AUTH_REGISTER] User already exists for uid', { ...meta, uid: decodedToken.uid });
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: 'User already registered',
        user: existingByUid[0],
      });
    }

    const existingByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingByUsername.length > 0) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already taken' });
    }

    const userEmail = decodedToken.email || String(body.email || '').trim();
    if (!userEmail) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email is required from Firebase token' });
    }

    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (existingByEmail.length > 0) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }

    const createdUsers = await db
      .insert(users)
      .values({
        firebaseUid: decodedToken.uid,
        username,
        email: userEmail,
        displayName: displayName || username,
        avatarUrl: decodedToken.picture || null,
        referredBy,
      })
      .returning();

    const createdUser = createdUsers[0];
    console.log('[AUTH_REGISTER] User created', { ...meta, userId: createdUser?.id, username: createdUser?.username });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: createdUser,
    });
  } catch (error) {
    console.error('[AUTH_REGISTER] Unexpected error', {
      ...meta,
      message: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
}
