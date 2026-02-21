/**
 * @fileoverview Обработчики запросов для управления базой ID пользователей
 * Telegram Bot Builder - User IDs Handlers (общая база на все проекты)
 */

import { Pool } from 'pg';

/**
 * Получить список ID пользователей (общая база)
 * @param pool - Пул подключений к БД
 * @returns Список записей ID
 */
export async function getUserIds(pool: Pool): Promise<{ id: number; userId: string; createdAt: Date; source: 'manual' | 'import' | 'bot' }[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, user_id, created_at, source FROM user_ids ORDER BY created_at DESC'
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id.toString(),
      createdAt: row.created_at,
      source: (row.source as 'manual' | 'import' | 'bot') || 'manual',
    }));
  } finally {
    client.release();
  }
}

/**
 * Добавить ID пользователя в общую базу
 * @param pool - Пул подключений к БД
 * @param userId - ID пользователя Telegram
 * @param source - Источник добавления
 * @returns Добавленная запись
 */
export async function addUserId(
  pool: Pool,
  userId: string,
  source: 'manual' | 'import' | 'bot' = 'manual'
): Promise<{ id: number; userId: string; createdAt: Date; source: 'manual' | 'import' | 'bot' }> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO user_ids (user_id, source)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id, user_id, created_at, source`,
      [userId, source]
    );
    if (result.rows.length === 0) {
      throw new Error('ID уже существует');
    }
    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id.toString(),
      createdAt: result.rows[0].created_at,
      source: result.rows[0].source as 'manual' | 'import' | 'bot',
    };
  } finally {
    client.release();
  }
}

/**
 * Удалить ID пользователя из общей базы
 * @param pool - Пул подключений к БД
 * @param id - ID записи для удаления
 * @returns true если удалено
 */
export async function deleteUserId(
  pool: Pool,
  id: number
): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM user_ids WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

/**
 * Получить статистику по ID пользователей (общая база)
 * @param pool - Пул подключений к БД
 * @returns Объект статистики
 */
export async function getUserIdsStats(pool: Pool): Promise<{ total: number; addedToday: number; addedThisWeek: number }> {
  const client = await pool.connect();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [total, todayResult, weekResult] = await Promise.all([
      client.query('SELECT COUNT(*) FROM user_ids'),
      client.query('SELECT COUNT(*) FROM user_ids WHERE created_at >= $1', [today]),
      client.query('SELECT COUNT(*) FROM user_ids WHERE created_at >= $1', [weekAgo]),
    ]);

    return {
      total: parseInt(total.rows[0].count),
      addedToday: parseInt(todayResult.rows[0].count),
      addedThisWeek: parseInt(weekResult.rows[0].count),
    };
  } finally {
    client.release();
  }
}
