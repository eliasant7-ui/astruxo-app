import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'astruxo_dev',
  },
  verbose: true,
  strict: false,
});