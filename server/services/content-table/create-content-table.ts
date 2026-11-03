/**
 * @fileoverview Создание системной таблицы контента под общей блокировкой проекта.
 */
import { pool } from '../../database/db';
import { ensureLockedContentTable } from './ensure-locked-content-table';
/**
 * Находит или создаёт _content и четыре столбца атомарно с другими синхронизаторами.
 * @param projectId - Проект пользователя
 * @returns Идентификатор системной таблицы
 */
export async function ensureContentTable(projectId: number): Promise<number> {
 const connection = await pool.connect();
 try {
  await connection.query('BEGIN');
  const project = await connection.query('SELECT id FROM bot_projects WHERE id = $1 FOR UPDATE', [projectId]);
  if (!project.rows[0]) throw new Error('Проект не найден');
  const { tableId } = await ensureLockedContentTable(connection, projectId);
  await connection.query('COMMIT');
  return tableId;
 } catch (error) {
  try { await connection.query('ROLLBACK'); } catch { /* Сохраняем исходную ошибку. */ }
  throw error;
 } finally { connection.release(); }
}
