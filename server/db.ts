import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Initialize database connection lazily
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  if (pool && db) {
    return { pool, db };
  }

  // Get DATABASE_URL from environment variables
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  console.log('Initializing database connection...');

  pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  db = drizzle(pool, { schema });

  return { pool, db };
}

// Export functions that initialize on first use
export function getPool(): Pool {
  const { pool } = initializeDatabase();
  return pool;
}

export function getDb() {
  const { db } = initializeDatabase();
  return db;
}

// For backward compatibility
export { getPool as pool, getDb as db };
