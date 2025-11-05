import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Load .env file explicitly and override existing env vars
config({ path: '.env', override: true });

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  console.log('DATABASE_URL exists:', !!dbUrl);
  console.log('DATABASE_URL preview:', dbUrl?.substring(0, 50) + '...');

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set!');
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete!');

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
