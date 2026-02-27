/**
 * @fileoverview Миграция добавляет поле avatar_url в таблицу user_bot_data
 * Для хранения URL аватарок пользователей Telegram
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * Выполняет миграцию вверх
 * @param {string} connectionString - Строка подключения к БД
 */
export async function up(connectionString: string): Promise<void> {
  const client = postgres(connectionString);
  const db = drizzle(client);

  await db.execute(sql`
    ALTER TABLE user_bot_data 
    ADD COLUMN IF NOT EXISTS avatar_url text;
  `);

  await client.end();
}

/**
 * Выполняет миграцию вниз (откат)
 * @param {string} connectionString - Строка подключения к БД
 */
export async function down(connectionString: string): Promise<void> {
  const client = postgres(connectionString);
  const db = drizzle(client);

  await db.execute(sql`
    ALTER TABLE user_bot_data 
    DROP COLUMN IF EXISTS avatar_url;
  `);

  await client.end();
}
