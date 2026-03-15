import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE,
  },
  verbose: true,
  strict: false,
});