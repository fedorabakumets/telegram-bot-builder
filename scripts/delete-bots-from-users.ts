/**
 * @fileoverview Скрипт удаления ботов из таблицы bot_users
 * @description Удаляет все записи, где is_bot = 1
 */

import { Pool } from 'pg';

async function deleteBotsFromUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Сначала посчитаем сколько ботов будет удалено
    const countResult = await pool.query(`
      SELECT COUNT(*) as count FROM bot_users WHERE is_bot = 1
    `);

    const botsCount = parseInt(countResult.rows[0].count);

    if (botsCount === 0) {
      console.log('✅ Боты в таблице bot_users не найдены');
      return;
    }

    console.log(`🔍 Найдено ботов для удаления: ${botsCount}`);

    // Получим список ботов для логирования
    const botsResult = await pool.query(`
      SELECT user_id, username, first_name 
      FROM bot_users 
      WHERE is_bot = 1
    `);

    console.log('\n📋 Боты для удаления:');
    botsResult.rows.forEach((bot, index) => {
      console.log(`  ${index + 1}. ID: ${bot.user_id}, Username: ${bot.username || 'N/A'}, Name: ${bot.first_name}`);
    });

    // Удаляем ботов
    const deleteResult = await pool.query(`
      DELETE FROM bot_users 
      WHERE is_bot = 1
    `);

    console.log(`\n✅ Удалено ботов: ${deleteResult.rowCount}`);

  } catch (error) {
    console.error('❌ Ошибка при удалении ботов:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запуск скрипта
deleteBotsFromUsers()
  .then(() => {
    console.log('\n✨ Скрипт завершён успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Скрипт завершён с ошибкой:', error);
    process.exit(1);
  });
