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

  // Get DATABASE_URL from environment variables (try multiple possible vars)
  const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

  if (!databaseUrl) {
    console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('DB') || key.includes('DATABASE')));
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  console.log('Initializing database connection...');

  pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 60000,
    statement_timeout: 60000,
    query_timeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  });

  // Add error handling for the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client:', err);
  });

  pool.on('connect', (client) => {
    client.on('error', (err) => {
      console.error('Database client error:', err);
    });
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
