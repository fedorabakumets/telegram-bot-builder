/**
 * @fileoverview Скрипт для получения аватарок существующих пользователей
 * Загружает avatar_url для всех пользователей из bot_users
 */

import { Pool } from 'pg';
import { TelegramBot } from 'telegraf';
import 'dotenv/config';

async function fetchUserAvatars() {
  const databaseUrl = process.env.DATABASE_URL;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не найден');
    process.exit(1);
  }

  if (!telegramBotToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден');
    process.exit(1);
  }

  console.log('🔧 Начало загрузки аватарок пользователей...');

  const pool = new Pool({ connectionString: databaseUrl });
  const bot = new TelegramBot(telegramBotToken);

  try {
    // Получаем всех пользователей без avatar_url
    const result = await pool.query(`
      SELECT user_id, username, first_name, last_name 
      FROM bot_users 
      WHERE avatar_url IS NULL 
      LIMIT 100
    `);

    const users = result.rows;
    console.log(`📊 Найдено ${users.length} пользователей без аватарок`);

    let updated = 0;
    let failed = 0;

    for (const user of users) {
      const userId = Number(user.user_id);
      
      try {
        // Получаем фото профиля пользователя
        const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
        
        if (photos.photos && photos.photos.length > 0 && photos.photos[0].length > 0) {
          const lastPhoto = photos.photos[0][photos.photos[0].length - 1];
          const file = await bot.getFile(lastPhoto.file_id);
          
          if (file.file_path) {
            // Обновляем avatar_url в БД
            await pool.query(`
              UPDATE bot_users 
              SET avatar_url = $1 
              WHERE user_id = $2
            `, [file.file_path, user.user_id]);
            
            console.log(`✅ ${user.username || user.first_name || userId}: ${file.file_path}`);
            updated++;
          }
        } else {
          console.log(`⏭️  ${user.username || user.first_name || userId}: нет аватарки`);
        }
      } catch (error: any) {
        console.error(`❌ ${user.username || user.first_name || userId}: ${error.message}`);
        failed++;
      }

      // Небольшая задержка чтобы не превысить лимиты API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`\n📈 Результат:`);
    console.log(`   ✅ Обновлено: ${updated}`);
    console.log(`   ❌ Ошибок: ${failed}`);
    console.log(`   ⏭️  Пропущено: ${users.length - updated - failed}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    await bot.stop('Fetching avatars');
    console.log('✅ Завершено');
  }
}

fetchUserAvatars();
