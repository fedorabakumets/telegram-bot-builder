/** @fileoverview Общая транзакция обслуживания таблицы с проверкой её существования под блокировкой. */
import type { Queryable } from '../../database/bot-tables/queryable';
/**
 * Удерживает таблицу от изменения структуры до завершения работы.
 * @param db - Выделенное соединение.
 * @param projectId - Авторизованный проект.
 * @param tableId - Таблица.
 * @param work - Операция над тем же соединением.
 * @returns Результат после COMMIT либо отказ после ROLLBACK.
 */
export async function lockedTableWrite<T>(db: Queryable, projectId: number, tableId: number, work: (db: Queryable) => Promise<T>) {
  await db.query('BEGIN');
  try {
    const owned = await db.query('SELECT id FROM bot_tables WHERE id=$1 AND project_id=$2 FOR UPDATE', [tableId, projectId]);
    if (!owned.rows[0]) { await db.query('ROLLBACK'); return { status: 404, message: 'Таблица не найдена' }; }
    const value = await work(db);
    if (value && typeof value === 'object' && 'status' in value) { await db.query('ROLLBACK'); return value; }
    await db.query('COMMIT'); return value;
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
