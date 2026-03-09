/**
 * @fileoverview Скрипт для обновления avatar_url с полными URL
 * Конвертирует относительные пути в полные URL Telegram
 */

import { Pool } from 'pg';
import 'dotenv/config';

async function updateAvatarUrls() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не найден');
    process.exit(1);
  }

  console.log('🔧 Обновление avatar_url...');

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Получаем токен бота
    const tokenResult = await pool.query(`
      SELECT token FROM bot_tokens 
      WHERE is_default = 1 
      LIMIT 1
    `);

    if (tokenResult.rows.length === 0) {
      console.error('❌ Токен бота не найден в БД');
      process.exit(1);
    }

    const telegramBotToken = tokenResult.rows[0].token;
    console.log(`🤖 Токен бота: ${telegramBotToken.substring(0, 10)}...`);

    // Обновляем записи с относительными путями
    const result = await pool.query(`
      UPDATE bot_users 
      SET avatar_url = 'https://api.telegram.org/file/bot' || $1 || '/' || avatar_url
      WHERE avatar_url NOT LIKE 'http%'
    `, [telegramBotToken]);

    console.log(`✅ Обновлено записей: ${result.rowCount}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    console.log('✅ Завершено');
  }
}

updateAvatarUrls();
