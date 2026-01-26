#!/usr/bin/env node

/**
 * Script to setup Railway database URL
 * This script helps configure the correct DATABASE_URL for Railway deployment
 */

const { execSync } = require('child_process');

console.log('🚀 Railway Database Setup Script');
console.log('================================');

// Check if Railway CLI is installed
try {
  execSync('railway --version', { stdio: 'pipe' });
  console.log('✅ Railway CLI is installed');
} catch (error) {
  console.error('❌ Railway CLI is not installed');
  console.log('📦 Install it with: npm install -g @railway/cli');
  process.exit(1);
}

// Check if logged in to Railway
try {
  execSync('railway whoami', { stdio: 'pipe' });
  console.log('✅ Logged in to Railway');
} catch (error) {
  console.error('❌ Not logged in to Railway');
  console.log('🔐 Login with: railway login');
  process.exit(1);
}

// Check current project
try {
  const projectInfo = execSync('railway status', { encoding: 'utf8' });
  console.log('📋 Current Railway project:');
  console.log(projectInfo);
} catch (error) {
  console.error('❌ No Railway project linked');
  console.log('🔗 Link project with: railway link');
  process.exit(1);
}

// Get current variables
console.log('\n🔍 Current environment variables:');
try {
  const variables = execSync('railway variables', { encoding: 'utf8' });
  console.log(variables);
  
  // Check if DATABASE_URL exists and what it contains
  const lines = variables.split('\n');
  const dbUrlLine = lines.find(line => line.includes('DATABASE_URL'));
  
  if (dbUrlLine) {
    console.log('\n📊 Current DATABASE_URL found:');
    console.log(dbUrlLine);
    
    if (dbUrlLine.includes('localhost:5432')) {
      console.log('\n⚠️  WARNING: DATABASE_URL points to localhost!');
      console.log('This will not work on Railway deployment.');
      console.log('\n🔧 To fix this:');
      console.log('1. Add PostgreSQL service to your Railway project');
      console.log('2. Railway will automatically set DATABASE_URL');
      console.log('3. Or manually set it with: railway variables set DATABASE_URL="postgresql://..."');
    } else if (dbUrlLine.includes('railway.internal') || dbUrlLine.includes('postgres://')) {
      console.log('✅ DATABASE_URL looks correct for Railway');
    }
  } else {
    console.log('\n❌ DATABASE_URL not found!');
    console.log('\n🔧 To fix this:');
    console.log('1. Add PostgreSQL service to your Railway project');
    console.log('2. Railway will automatically generate DATABASE_URL');
    console.log('3. Or manually set it with: railway variables set DATABASE_URL="postgresql://..."');
  }
  
} catch (error) {
  console.error('❌ Failed to get variables:', error.message);
}

// Check for PostgreSQL service
console.log('\n🔍 Checking for PostgreSQL service...');
try {
  const services = execSync('railway services', { encoding: 'utf8' });
  console.log(services);
  
  if (services.includes('postgres') || services.includes('Postgres')) {
    console.log('✅ PostgreSQL service found');
    console.log('\n🔧 Railway automatically generates these variables when PostgreSQL service is connected:');
    console.log('- DATABASE_URL (private URL for internal communication)');
    console.log('- PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD (individual parameters)');
  } else {
    console.log('❌ PostgreSQL service not found');
    console.log('\n🔧 To add PostgreSQL service:');
    console.log('1. Go to your Railway dashboard');
    console.log('2. Click "Add Service"');
    console.log('3. Select "Database" -> "PostgreSQL"');
    console.log('4. Railway will automatically generate DATABASE_URL');
  }
} catch (error) {
  console.log('⚠️  Could not check services (trying alternative method)');
  
  // Alternative: check if DATABASE_URL contains railway.internal
  try {
    const variables = execSync('railway variables', { encoding: 'utf8' });
    if (variables.includes('railway.internal')) {
      console.log('✅ PostgreSQL service appears to be connected (found railway.internal URL)');
    }
  } catch (e) {
    console.log('❌ Could not determine PostgreSQL service status');
  }
}

console.log('\n📋 Next steps:');
console.log('1. Ensure PostgreSQL service is added to your Railway project');
console.log('2. Railway automatically generates DATABASE_URL with private URL');
console.log('3. Deploy: railway up');
console.log('4. Test database connection: railway run npm run db:test');

console.log('\n🔗 Useful links:');
console.log('- Railway Dashboard: https://railway.app/dashboard');
console.log('- PostgreSQL Service Guide: https://docs.railway.app/databases/postgresql');
console.log('- Environment Variables: https://docs.railway.app/develop/variables');