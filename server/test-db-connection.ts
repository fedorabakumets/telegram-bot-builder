#!/usr/bin/env tsx

/**
 * Test database connection script
 * This script tests the DATABASE_URL connection to ensure it's working properly
 */

import { Client } from 'pg';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('================================');

  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('🔧 Make sure PostgreSQL service is connected to your Railway project');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');
  console.log(`📊 URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to database');

    console.log('\n📊 Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Query executed successfully');
    console.log(`📋 PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`📋 Database: ${result.rows[0].current_database}`);
    console.log(`📋 User: ${result.rows[0].current_user}`);

    console.log('\n🔍 Checking database permissions...');
    const permResult = await client.query(`
      SELECT 
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        has_database_privilege(current_user, current_database(), 'TEMP') as can_temp
    `);
    
    const perms = permResult.rows[0];
    console.log(`📋 Can CREATE: ${perms.can_create ? '✅' : '❌'}`);
    console.log(`📋 Can CONNECT: ${perms.can_connect ? '✅' : '❌'}`);
    console.log(`📋 Can create TEMP tables: ${perms.can_temp ? '✅' : '❌'}`);

    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);