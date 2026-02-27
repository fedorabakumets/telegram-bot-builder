/**
 * @fileoverview Скрипт для загрузки аватарки бота
 * Получает фото профиля бота через getChat
 */

import { Pool } from 'pg';
import 'dotenv/config';

async function fetchBotAvatar() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не найден');
    process.exit(1);
  }

  console.log('🔧 Начало загрузки аватарки бота...');

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Получаем токен бота по умолчанию
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

    // Получаем информацию о боте через getChat
    const chatResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/getChat?chat_id=${telegramBotToken.split(':')[0]}`
    );
    const chatData = await chatResponse.json();

    if (!chatData.ok) {
      console.error('❌ Ошибка получения информации о боте:', chatData.description);
      process.exit(1);
    }

    const bot = chatData.result;
    const botId = bot.id;
    console.log(`📊 Бот: ${bot.username} (ID: ${botId})`);

    if (!bot.photo) {
      console.log('⏭️  У бота нет аватарки');
      process.exit(0);
    }

    const photoFile = bot.photo.big_file_id || bot.photo.small_file_id;

    // Получаем file_path
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${photoFile}`
    );
    const fileData = await fileResponse.json();

    if (!fileData.ok || !fileData.result.file_path) {
      console.error('❌ Ошибка получения файла:', fileData.description);
      process.exit(1);
    }

    const fullAvatarUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${fileData.result.file_path}`;

    // Сохраняем бота в bot_users с avatar_url
    await pool.query(`
      INSERT INTO bot_users (user_id, username, first_name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        avatar_url = EXCLUDED.avatar_url,
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name
    `, [botId.toString(), bot.username, bot.first_name, fullAvatarUrl]);

    console.log(`✅ Аватарка бота сохранена: ${fullAvatarUrl}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    console.log('✅ Завершено');
  }
}

fetchBotAvatar();
