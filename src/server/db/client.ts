/**
 * Database connection setup using Drizzle ORM with Neon PostgreSQL
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.warn('⚠️ DATABASE_URL not found. Database features will be disabled.');
}

// Create Neon connection
const sql = databaseUrl ? neon(databaseUrl) : null;

// Create Drizzle ORM instance
export const db = sql ? drizzle(sql, { schema }) : null;

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  if (!db) {
    console.warn('⚠️ Database not configured');
    return false;
  }
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * Close database connection (Neon uses HTTP, no connection to close)
 */
export async function closeConnection(): Promise<void> {
  console.log('✅ Database connection closed');
}
