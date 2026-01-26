import dotenv from 'dotenv';
dotenv.config({ debug: false });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔍 Database configuration:', {
  url: process.env.DATABASE_URL?.substring(0, 30) + '...',
  nodeEnv: process.env.NODE_ENV,
  sslEnabled: process.env.NODE_ENV === 'production'
});

// Configure pool with better settings for Railway
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced from 20 to avoid connection limits
  min: 1,  // Reduced from 2 to save resources
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 20000, // Increased timeout to 20 seconds
  acquireTimeoutMillis: 60000, // Timeout acquiring connection after 60 seconds
  ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost') ? { 
    rejectUnauthorized: false,
    require: true 
  } : false
};

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  console.error('Error details:', {
    code: err.code,
    errno: err.errno,
    syscall: err.syscall
  });
});

pool.on('connect', (client) => {
  console.log('✅ Connected to database');
});

pool.on('acquire', () => {
  console.log('🔗 Database connection acquired');
});

pool.on('remove', () => {
  console.log('🔌 Database connection removed');
});

export const db = drizzle(pool, { schema });

// Test connection on startup
async function testConnection() {
  try {
    console.log('🧪 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connection test successful:', {
      time: result.rows[0].current_time,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    client.release();
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Connection details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      port: error.port
    });
    
    // Don't throw error here, let the app try to continue
    // The health checks will catch ongoing issues
  }
}

// Test connection after a short delay to allow for startup
setTimeout(testConnection, 2000);
