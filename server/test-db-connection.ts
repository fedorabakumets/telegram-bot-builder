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
    console.log('💡 Make sure to set DATABASE_URL in your environment variables');
    process.exit(1);
  }

  console.log('📡 DATABASE_URL is configured');
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  
  // Parse DATABASE_URL to show connection details (without password)
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('🔗 Connection details:', {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      username: url.username,
      ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
    });
  } catch (error) {
    console.error('⚠️ Could not parse DATABASE_URL format');
  }

  // Test basic connection with retry logic
  const maxAttempts = 3;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`\n🧪 Connection attempt ${attempt}/${maxAttempts}...`);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        require: true 
      } : false,
      connectionTimeoutMillis: 20000,
      acquireTimeoutMillis: 30000
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

      console.log('\n🎉 All database tests passed!');
      await pool.end();
      process.exit(0);
      
    } catch (error: any) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      console.error('🔍 Error details:', {
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname,
        port: error.port
      });
      
      await pool.end();
      
      if (attempt >= maxAttempts) {
        console.error('\n💥 All connection attempts failed!');
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check if DATABASE_URL is correct');
        console.log('2. Verify PostgreSQL server is running');
        console.log('3. Check network connectivity');
        console.log('4. Verify SSL settings for production');
        console.log('5. Check firewall and security group settings');
        process.exit(1);
      }
      
      // Wait before retry
      const waitTime = 2000 * attempt;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});