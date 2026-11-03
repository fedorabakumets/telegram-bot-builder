/**
 * @fileoverview Создаёт структуру контента на соединении, удерживающем блокировку проекта.
 */
import type { Queryable } from '../../database/bot-tables/queryable';
/**
 * Обеспечивает структуру _content внутри уже открытой транзакции и project lock.
 * @param connection - SQL-соединение с заблокированной строкой проекта
 * @param projectId - Идентификатор проекта
 * @returns Таблица и маппинг идентификаторов столбцов
 */
export async function ensureLockedContentTable(connection: Queryable, projectId: number) {
 const tables = await connection.query('SELECT id FROM bot_tables WHERE project_id = $1 AND name = $2 ORDER BY id LIMIT 1 FOR UPDATE', [projectId, '_content']);
 let tableId = Number(tables.rows[0]?.id);
 if (!tableId) {
  const created = await connection.query('INSERT INTO bot_tables (project_id, name) VALUES ($1, $2) RETURNING id', [projectId, '_content']);
  tableId = Number(created.rows[0].id);
 }
 const columns = await connection.query('SELECT id, name FROM bot_table_columns WHERE table_id = $1 ORDER BY position', [tableId]);
 const columnIds = Object.fromEntries(columns.rows.map((column) => [String(column.name), String(column.id)]));
 const fields = ['key', 'type', 'sheet', 'value'];
 for (const [position, name] of fields.entries()) {
  if (!columnIds[name]) {
   const created = await connection.query('INSERT INTO bot_table_columns (table_id, name, position) VALUES ($1, $2, $3) RETURNING id', [tableId, name, position]);
   columnIds[name] = String(created.rows[0].id);
  }
 }
 return { tableId, columnIds, fields };
}
