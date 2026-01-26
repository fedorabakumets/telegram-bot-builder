#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('📡 DATABASE_URL is set');
  
  // Test basic connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test pool connection
    console.log('🔌 Testing pool connection...');
    const client = await pool.connect();
    console.log('✅ Pool connection successful');
    
    // Test simple query
    console.log('📊 Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query successful:', {
      time: result.rows[0].current_time,
      version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]
    });
    
    client.release();

    // Test Drizzle connection
    console.log('🐉 Testing Drizzle ORM connection...');
    const db = drizzle(pool);
    const drizzleResult = await db.execute(sql`SELECT 1 as health, NOW() as timestamp`);
    console.log('✅ Drizzle connection successful:', drizzleResult.rows[0]);

    // Test pool stats
    console.log('📈 Pool statistics:', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });

    console.log('🎉 All database tests passed!');
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      port: error.port
    });
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Connection pool closed');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);