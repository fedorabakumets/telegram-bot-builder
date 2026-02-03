#!/usr/bin/env tsx

/**
 * @fileoverview Скрипт проверки переменных окружения
 *
 * Этот скрипт проверяет наличие необходимых переменных окружения,
 * анализирует их значения и выводит информацию о системе.
 * Используется для диагностики проблем с настройками при запуске приложения.
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Проверка переменных окружения');
console.log('================================');

// Проверка обязательных переменных окружения
const requiredVars = [
  'DATABASE_URL',
  'NODE_ENV'
];

const optionalVars = [
  'PORT',
  'SESSION_SECRET',
  'TELEGRAM_API_ID',
  'TELEGRAM_API_HASH'
];

console.log('\n📋 Required Variables:');
let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'DATABASE_URL' ? value.substring(0, 30) + '...' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allRequiredPresent = false;
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.length > 30 ? value.substring(0, 30) + '...' : value}`);
  } else {
    console.log(`⚪ ${varName}: not set (optional)`);
  }
});

console.log('\n🔧 System Information:');
console.log(`Node.js Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Working Directory: ${process.cwd()}`);

if (process.env.DATABASE_URL) {
  console.log('\n🔍 Database URL Analysis:');
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`Protocol: ${url.protocol}`);
    console.log(`Host: ${url.hostname}`);
    console.log(`Port: ${url.port || 'default'}`);
    console.log(`Database: ${url.pathname.substring(1)}`);
    console.log(`Username: ${url.username}`);
    console.log(`Password: ${url.password ? '[HIDDEN]' : 'not set'}`);
    
    // Check for SSL parameters
    const searchParams = url.searchParams;
    if (searchParams.has('sslmode')) {
      console.log(`SSL Mode: ${searchParams.get('sslmode')}`);
    }
  } catch (error) {
    console.log(`❌ Invalid DATABASE_URL format: ${(error as Error).message || String(error)}`);
    allRequiredPresent = false;
  }
}

console.log('\n📊 Summary:');
if (allRequiredPresent) {
  console.log('✅ All required environment variables are set');
  process.exit(0);
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('\n💡 To fix this:');
  console.log('1. Create a .env file in the project root');
  console.log('2. Add the missing variables');
  console.log('3. For Railway: use `railway variables set VARIABLE_NAME=value`');
  process.exit(1);
}