import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  },
  verbose: true,
  strict: false,
});