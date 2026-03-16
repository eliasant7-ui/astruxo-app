import { sql } from 'drizzle-orm';
import { db } from './client.js';

let isSchemaReady = false;
let ensureSchemaPromise = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    follower_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    coin_balance INTEGER NOT NULL DEFAULT 0,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    live_confirmed_at TIMESTAMP,
    referred_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS firebase_uid_idx ON users (firebase_uid)`,
  `CREATE INDEX IF NOT EXISTS username_idx ON users (username)`,
  `CREATE INDEX IF NOT EXISTS users_is_live_idx ON users (is_live)`,
  `CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    stream_id INTEGER,
    content TEXT,
    media_type VARCHAR(20),
    media_url TEXT,
    thumbnail_url TEXT,
    link_preview JSON,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts (user_id)`,
  `CREATE INDEX IF NOT EXISTS posts_stream_id_idx ON posts (stream_id)`,
  `CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at)`,
  `CREATE INDEX IF NOT EXISTS posts_media_type_idx ON posts (media_type)`,
];

export async function ensureCoreTables() {
  if (isSchemaReady) {
    return;
  }

  if (!db) {
    throw new Error('Database not configured');
  }

  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      console.log('[DB_BOOTSTRAP] Ensuring core tables exist');

      for (const statement of schemaStatements) {
        await db.execute(sql.raw(statement));
      }

      isSchemaReady = true;
      console.log('[DB_BOOTSTRAP] Core tables are ready');
    })().catch((error) => {
      ensureSchemaPromise = null;
      console.error('[DB_BOOTSTRAP] Failed to ensure core tables', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    });
  }

  await ensureSchemaPromise;
}
