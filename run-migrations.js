import 'dotenv/config';
import { ensureCoreTables } from './api/db/bootstrap.js';

async function main() {
  const hasDbUrl = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );

  if (!hasDbUrl) {
    throw new Error('Missing DATABASE_URL/POSTGRES_URL for migration');
  }

  console.log('[DB_MIGRATE] Ensuring core Postgres schema');
  await ensureCoreTables();
  console.log('[DB_MIGRATE] Core schema ready');
}

main().catch((error) => {
  console.error('[DB_MIGRATE] Failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
