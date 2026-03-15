import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🔄 Conectando a MySQL...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'astruxo_dev',
    multipleStatements: true,
  });

  const db = drizzle(connection);

  console.log('🔄 Ejecutando migraciones...');
  
  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'drizzle'),
  });

  console.log('✅ Migraciones completadas!');
  
  await connection.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
