/**
 * @fileoverview Скрипт для получения аватарок существующих пользователей
 * Загружает avatar_url для всех пользователей из bot_users
 */

import { Pool } from 'pg';
import 'dotenv/config';

async function fetchUserAvatars() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не найден');
    process.exit(1);
  }

  console.log('🔧 Начало загрузки аватарок пользователей...');

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
    console.log(`🤖 Используем токен бота: ${telegramBotToken.substring(0, 10)}...`);

    // Получаем всех пользователей без avatar_url
    const result = await pool.query(`
      SELECT user_id, username, first_name, last_name, project_id
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
        // Пробуем получить аватарку через getUserProfilePhotos (для пользователей)
        let fileData: any = null;
        
        const photosResponse = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/getUserProfilePhotos?user_id=${userId}&limit=1`
        );
        const photosData = await photosResponse.json();

        if (photosData.ok && photosData.result.photos && photosData.result.photos.length > 0) {
          const lastPhoto = photosData.result.photos[0][photosData.result.photos[0].length - 1];

          // Получаем file_path
          const fileResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${lastPhoto.file_id}`
          );
          fileData = await fileResponse.json();
        } else {
          // Если не удалось получить через getUserProfilePhotos, пробуем getChat (для ботов)
          const chatResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/getChat?chat_id=${userId}`
          );
          const chatData = await chatResponse.json();

          if (chatData.ok && chatData.result?.photo) {
            const photo = chatData.result.photo;
            // Используем большое фото
            const photoFile = photo.big_file_id || photo.small_file_id;
            
            const fileResponse = await fetch(
              `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${photoFile}`
            );
            fileData = await fileResponse.json();
          }
        }

        if (fileData?.ok && fileData.result.file_path) {
          // Строим полный URL для файла
          const fullAvatarUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${fileData.result.file_path}`;

          // Обновляем avatar_url в БД
          await pool.query(`
            UPDATE bot_users
            SET avatar_url = $1
            WHERE user_id = $2 AND project_id = $3
          `, [fullAvatarUrl, user.user_id, user.project_id]);

          console.log(`✅ ${user.username || user.first_name || userId}: ${fullAvatarUrl}`);
          updated++;
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
    console.log('✅ Завершено');
  }
}

fetchUserAvatars();
