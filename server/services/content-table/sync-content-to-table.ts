/**
 * @fileoverview Синхронизация таблицы контента из актуальной ревизии под блокировкой БД.
 */
import { pool } from '../../database/db';
import { syncCurrentProjectContent } from './sync-current-project-content';
/**
 * Синхронизирует актуальный сохранённый сценарий, не доверяя запоздавшему снимку вызова.
 * @param projectId - Проект пользователя
 * @param _scenarioData - Старый совместимый аргумент; актуальные данные читаются под блокировкой
 * @returns Ревизия синхронизированного актуального снимка
 */
export async function syncContentToTable(projectId: number, _scenarioData: unknown): Promise<number | null> {
 const connection = await pool.connect();
 try { return await syncCurrentProjectContent(connection, projectId); }
 finally { connection.release(); }
}
