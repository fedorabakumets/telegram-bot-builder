/**
 * @fileoverview Скрипт для загрузки аватарки бота
 * Получает фото профиля бота через getChat и сохраняет в bot_tokens
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
      SELECT id, token FROM bot_tokens
      WHERE is_default = 1
      LIMIT 1
    `);

    if (tokenResult.rows.length === 0) {
      console.error('❌ Токен бота не найден в БД');
      process.exit(1);
    }

    const tokenId = tokenResult.rows[0].id;
    const telegramBotToken = tokenResult.rows[0].token;
    console.log(`🤖 Токен бота: ${telegramBotToken.substring(0, 10)}... (ID: ${tokenId})`);

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

    let fullAvatarUrl: string | null = null;

    if (bot.photo) {
      const photoFile = bot.photo.big_file_id || bot.photo.small_file_id;

      // Получаем file_path
      const fileResponse = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${photoFile}`
      );
      const fileData = await fileResponse.json();

      if (!fileData.ok || !fileData.result.file_path) {
        console.log('⏭️  У бота нет аватарки или не удалось получить файл');
      } else {
        fullAvatarUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${fileData.result.file_path}`;
        console.log(`📸 Аватарка найдена: ${fullAvatarUrl}`);
      }
    } else {
      console.log('⏭️  У бота нет аватарки');
    }

    // Сохраняем информацию о боте в bot_tokens (не в bot_users!)
    await pool.query(`
      UPDATE bot_tokens
      SET
        bot_photo_url = $1,
        bot_username = $2,
        bot_first_name = $3
      WHERE id = $4
    `, [fullAvatarUrl, bot.username, bot.first_name, tokenId]);

    console.log(`✅ Информация о боте сохранена в bot_tokens (ID: ${tokenId})`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    console.log('✅ Завершено');
  }
}

fetchBotAvatar();
