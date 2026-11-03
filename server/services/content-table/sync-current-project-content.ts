/**
 * @fileoverview Синхронизация актуального сценария и контента под одной блокировкой PostgreSQL.
 */
import type { Queryable } from '../../database/bot-tables/queryable';
import { extractContentFromNodes } from './content-key-parser';
import { ensureLockedContentTable } from './ensure-locked-content-table';
/**
 * Читает только текущую ревизию, сериализуя sync с любым writer строки проекта.
 * @param connection - Выделенное SQL-соединение без активной транзакции
 * @param projectId - Проект контента
 * @returns Ревизия синхронизированного снимка либо отсутствие проекта
 */
export async function syncCurrentProjectContent(connection: Queryable, projectId: number): Promise<number | null> {
 await connection.query('BEGIN');
 try {
  const project = await connection.query('SELECT data, revision FROM bot_projects WHERE id = $1 FOR UPDATE', [projectId]);
  if (!project.rows[0]) { await connection.query('COMMIT'); return null; }
  const { tableId, columnIds, fields } = await ensureLockedContentTable(connection, projectId);
  const rows = await connection.query('SELECT id, row_index, data FROM bot_table_rows WHERE table_id = $1 ORDER BY row_index FOR UPDATE', [tableId]);
  const byKey = new Map(rows.rows.map((row) => {
   const data = row.data as Record<string, string>;
   return [data[columnIds.key] ?? data.key, row];
  }));
  const snapshot = project.rows[0].data as { sheets?: unknown[] } | null;
  const entries = extractContentFromNodes(snapshot?.sheets ?? []);
  const keys = new Set(entries.map((entry) => entry.key));
  let rowIndex = rows.rows.reduce((maximum, row) => Math.max(maximum, Number(row.row_index)), -1) + 1;
  for (const entry of entries) {
   const data = Object.fromEntries(fields.map((field) => [columnIds[field], entry[field as keyof typeof entry]]));
   const existing = byKey.get(entry.key);
   if (existing) {
    if (JSON.stringify(existing.data) !== JSON.stringify(data)) await connection.query('UPDATE bot_table_rows SET data = $2::jsonb WHERE id = $1', [existing.id, JSON.stringify(data)]);
   } else await connection.query('INSERT INTO bot_table_rows (table_id, row_index, data) VALUES ($1, $2, $3::jsonb)', [tableId, rowIndex++, JSON.stringify(data)]);
  }
  for (const row of rows.rows) {
   const data = row.data as Record<string, string>;
   const key = data[columnIds.key] ?? data.key;
   const type = data[columnIds.type] ?? data.type;
   if (key && !keys.has(key) && type !== 'manual') await connection.query('DELETE FROM bot_table_rows WHERE id = $1', [row.id]);
  }
  await connection.query('COMMIT');
  return Number(project.rows[0].revision);
 } catch (error) {
  try { await connection.query('ROLLBACK'); } catch { /* Исходная ошибка важнее отказа отката соединения. */ }
  throw error;
 }
}
