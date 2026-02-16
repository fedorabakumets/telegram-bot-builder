#!/usr/bin/env tsx

/**
 * Скрипт для тестирования подключения к базе данных
 * Этот скрипт проверяет подключение через DATABASE_URL, чтобы убедиться, что оно работает правильно
 */

import 'dotenv/config';
import { Client } from 'pg';

/**
 * Асинхронная функция для тестирования подключения к базе данных PostgreSQL
 * Выполняет проверку наличия переменной DATABASE_URL, подключение к базе данных,
 * выполнение базового запроса и проверку прав доступа.
 */
async function testDatabaseConnection() {
  console.log('🔍 Тестирование подключения к базе данных...');
  console.log('================================');

  // Проверка существования переменной DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ Переменная окружения DATABASE_URL не найдена');
    console.log('🔧 Убедитесь, что служба PostgreSQL подключена к вашему проекту Railway');
    process.exit(1);
  }

  console.log('✅ Переменная DATABASE_URL найдена');
  console.log(`📊 URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);

  // Создание клиента PostgreSQL с указанными параметрами подключения
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('\n🔌 Подключение к базе данных...');
    await client.connect();
    console.log('✅ Успешное подключение к базе данных');

    console.log('\n📊 Тестирование базового запроса...');
    // Выполнение запроса для получения информации о версии PostgreSQL, текущей базе данных и пользователе
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Запрос выполнен успешно');
    console.log(`📋 Версия PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`📋 База данных: ${result.rows[0].current_database}`);
    console.log(`📋 Пользователь: ${result.rows[0].current_user}`);

    console.log('\n🔍 Проверка прав доступа к базе данных...');
    // Запрос для проверки прав доступа пользователя к текущей базе данных
    const permResult = await client.query(`
      SELECT
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        has_database_privilege(current_user, current_database(), 'TEMP') as can_temp
    `);

    const perms = permResult.rows[0];
    console.log(`📋 Может CREATE: ${perms.can_create ? '✅' : '❌'}`);
    console.log(`📋 Может CONNECT: ${perms.can_connect ? '✅' : '❌'}`);
    console.log(`📋 Может создавать TEMP таблицы: ${perms.can_temp ? '✅' : '❌'}`);

    console.log('\n🎉 Тест подключения к базе данных успешно завершен!');

  } catch (error) {
    console.error('❌ Подключение к базе данных не удалось:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Подключение к базе данных закрыто');
  }
}

// Запуск теста подключения
testDatabaseConnection().catch(console.error);