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
      console.log('1. Add PostgreSQL plugin to your Railway project');
      console.log('2. Copy the DATABASE_URL from the plugin');
      console.log('3. Set it with: railway variables set DATABASE_URL="postgresql://..."');
    } else if (dbUrlLine.includes('railway.app') || dbUrlLine.includes('postgres://')) {
      console.log('✅ DATABASE_URL looks correct for Railway');
    }
  } else {
    console.log('\n❌ DATABASE_URL not found!');
    console.log('\n🔧 To fix this:');
    console.log('1. Add PostgreSQL plugin to your Railway project');
    console.log('2. Copy the DATABASE_URL from the plugin');
    console.log('3. Set it with: railway variables set DATABASE_URL="postgresql://..."');
  }
  
} catch (error) {
  console.error('❌ Failed to get variables:', error.message);
}

// Check for PostgreSQL plugin
console.log('\n🔍 Checking for PostgreSQL plugin...');
try {
  const plugins = execSync('railway plugins', { encoding: 'utf8' });
  console.log(plugins);
  
  if (plugins.includes('postgresql') || plugins.includes('postgres')) {
    console.log('✅ PostgreSQL plugin found');
  } else {
    console.log('❌ PostgreSQL plugin not found');
    console.log('\n🔧 To add PostgreSQL plugin:');
    console.log('1. Go to your Railway dashboard');
    console.log('2. Click "Add Plugin"');
    console.log('3. Select "PostgreSQL"');
    console.log('4. Copy the DATABASE_URL from the plugin');
  }
} catch (error) {
  console.log('⚠️  Could not check plugins (this is normal for some Railway CLI versions)');
}

console.log('\n📋 Next steps:');
console.log('1. Ensure PostgreSQL plugin is added to your Railway project');
console.log('2. Copy the DATABASE_URL from the PostgreSQL plugin');
console.log('3. Set the variable: railway variables set DATABASE_URL="<your-railway-db-url>"');
console.log('4. Deploy: railway up');
console.log('5. Test: railway run npm run db:test');

console.log('\n🔗 Useful links:');
console.log('- Railway Dashboard: https://railway.app/dashboard');
console.log('- PostgreSQL Plugin Guide: https://docs.railway.app/databases/postgresql');
console.log('- Environment Variables: https://docs.railway.app/develop/variables');