/**
 * @fileoverview Обработчики запросов для управления базой ID пользователей
 * Telegram Bot Builder - User IDs API Handlers
 */

import { Pool } from 'pg';

/**
 * Получить список ID пользователей проекта
 * @param pool - Пул подключений к БД
 * @param projectId - ID проекта
 * @returns Список записей ID
 */
export async function getUserIds(pool: Pool, projectId: number) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, user_id, created_at FROM user_ids WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id.toString(),
      createdAt: row.created_at,
      source: 'manual' as const,
    }));
  } finally {
    client.release();
  }
}

/**
 * Добавить ID пользователя в проект
 * @param pool - Пул подключений к БД
 * @param projectId - ID проекта
 * @param userId - ID пользователя Telegram
 * @returns Добавленная запись
 */
export async function addUserId(
  pool: Pool,
  projectId: number,
  userId: string
) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO user_ids (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING id, user_id, created_at`,
      [projectId, userId]
    );
    if (result.rows.length === 0) {
      throw new Error('ID уже существует');
    }
    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id.toString(),
      createdAt: result.rows[0].created_at,
      source: 'manual' as const,
    };
  } finally {
    client.release();
  }
}

/**
 * Удалить ID пользователя из проекта
 * @param pool - Пул подключений к БД
 * @param projectId - ID проекта
 * @param id - ID записи для удаления
 * @returns true если удалено
 */
export async function deleteUserId(
  pool: Pool,
  projectId: number,
  id: number
) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM user_ids WHERE id = $1 AND project_id = $2 RETURNING id',
      [id, projectId]
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

/**
 * Получить статистику по ID пользователей
 * @param pool - Пул подключений к БД
 * @param projectId - ID проекта
 * @returns Объект статистики
 */
export async function getUserIdsStats(pool: Pool, projectId: number) {
  const client = await pool.connect();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [total, todayResult, weekResult] = await Promise.all([
      client.query(
        'SELECT COUNT(*) FROM user_ids WHERE project_id = $1',
        [projectId]
      ),
      client.query(
        'SELECT COUNT(*) FROM user_ids WHERE project_id = $1 AND created_at >= $2',
        [projectId, today]
      ),
      client.query(
        'SELECT COUNT(*) FROM user_ids WHERE project_id = $1 AND created_at >= $2',
        [projectId, weekAgo]
      ),
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
