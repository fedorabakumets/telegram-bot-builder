/** @fileoverview Изменение строки с перечитыванием ограничений после блокировки таблицы. */
import type { Queryable } from './queryable';
import { loadColumnsInProject } from './load-scope';
import { validateCells } from './validate-cells';
import { mergeRowInProject, replaceRowInProject } from './mutate-row';
/**
 * Проверяет актуальные настройки и сохраняет строку в одной транзакции.
 * @param db - Выделенное соединение.
 * @param projectId - Проект.
 * @param tableId - Таблица.
 * @param rowId - Строка.
 * @param data - Входные ячейки.
 * @param replace - Полная замена вместо слияния; проверяет обязательные пропущенные поля.
 * @returns Сохранённая строка либо отказ без записи.
 */
export async function patchRowLocked(db: Queryable, projectId: number, tableId: number, rowId: number, data: unknown, replace = false) {
  await db.query('BEGIN');
  try {
    const table = await db.query('SELECT id FROM bot_tables WHERE id=$1 AND project_id=$2 FOR UPDATE', [tableId, projectId]);
    if (!table.rows[0]) { await db.query('ROLLBACK'); return { status: 404, message: 'Таблица не найдена' }; }
    const columns = await loadColumnsInProject(db, projectId, tableId);
    const checked = validateCells(data, new Set(columns.map(column => String(column.id))), columns, replace);
    if (!checked.ok) { await db.query('ROLLBACK'); return { status: 400, message: checked.message }; }
    const row = await (replace ? replaceRowInProject : mergeRowInProject)(db, projectId, tableId, rowId, checked.data);
    if ('status' in row) { await db.query('ROLLBACK'); return row; }
    await db.query('COMMIT'); return row;
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
