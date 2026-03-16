/**
 * Vercel serverless database client
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!databaseUrl) {
  console.warn('[DB] DATABASE_URL/POSTGRES_URL is missing');
}

const sql = databaseUrl ? neon(databaseUrl) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

export async function testConnection() {
  if (!db) {
    console.warn('[DB] testConnection skipped: db not configured');
    return false;
  }

  try {
    await db.execute('SELECT 1');
    console.log('[DB] Connection successful');
    return true;
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    return false;
  }
}

export async function closeConnection() {
  console.log('[DB] Neon HTTP client does not require explicit close');
}
