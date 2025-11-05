import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Export Drizzle instance with schema
export const db = drizzle(pool, { schema });
