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

console.log('\n📋 Обязательные переменные:');
let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'DATABASE_URL' ? value.substring(0, 30) + '...' : value}`);
  } else {
    console.log(`❌ ${varName}: НЕ УСТАНОВЛЕНО`);
    allRequiredPresent = false;
  }
});

console.log('\n📋 Опциональные переменные:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.length > 30 ? value.substring(0, 30) + '...' : value}`);
  } else {
    console.log(`⚪ ${varName}: не установлено (опционально)`);
  }
});

console.log('\n🔧 Информация о системе:');
console.log(`Версия Node.js: ${process.version}`);
console.log(`Платформа: ${process.platform}`);
console.log(`Архитектура: ${process.arch}`);
console.log(`Рабочая директория: ${process.cwd()}`);

if (process.env.DATABASE_URL) {
  console.log('\n🔍 Анализ URL базы данных:');
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`Протокол: ${url.protocol}`);
    console.log(`Хост: ${url.hostname}`);
    console.log(`Порт: ${url.port || 'по умолчанию'}`);
    console.log(`База данных: ${url.pathname.substring(1)}`);
    console.log(`Имя пользователя: ${url.username}`);
    console.log(`Пароль: ${url.password ? '[СКРЫТ]' : 'не установлен'}`);

    // Проверка параметров SSL
    const searchParams = url.searchParams;
    if (searchParams.has('sslmode')) {
      console.log(`Режим SSL: ${searchParams.get('sslmode')}`);
    }
  } catch (error) {
    console.log(`❌ Неверный формат DATABASE_URL: ${(error as Error).message || String(error)}`);
    allRequiredPresent = false;
  }
}

console.log('\n📊 Сводка:');
if (allRequiredPresent) {
  console.log('✅ Все обязательные переменные окружения установлены');
  process.exit(0);
} else {
  console.log('❌ Некоторые обязательные переменные окружения отсутствуют');
  console.log('\n💡 Чтобы исправить:');
  console.log('1. Создайте файл .env в корне проекта');
  console.log('2. Добавьте недостающие переменные');
  console.log('3. Для Railway: используйте `railway variables set VARIABLE_NAME=value`');
  process.exit(1);
}