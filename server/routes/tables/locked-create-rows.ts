/** @fileoverview Атомарное добавление строк с актуальными ограничениями и проверкой полного результата. */
import { loadColumnsInProject } from '../../database/bot-tables/load-scope';
import { insertRowsInProject, nextRowIndex } from '../../database/bot-tables/mutate-row';
import { validateCells } from '../../database/bot-tables/validate-cells';
import type { Queryable } from '../../database/bot-tables/queryable';
/**
 * Добавляет все строки после блокировки таблицы либо откатывает весь пакет.
 * @param db - Выделенное соединение.
 * @param projectId - Проект.
 * @param tableId - Таблица.
 * @param rows - Строки API.
 * @returns Записанные строки или безопасный отказ.
 */
export async function createRowsLocked(db: Queryable, projectId: number, tableId: number, rows: Array<{ rowIndex?: number; data?: unknown }>) {
  await db.query('BEGIN');
  try {
    const table = await db.query('SELECT id FROM bot_tables WHERE id=$1 AND project_id=$2 FOR UPDATE', [tableId, projectId]);
    if (!table.rows[0]) { await db.query('ROLLBACK'); return { status: 404, message: 'Таблица не найдена' }; }
    const columns = await loadColumnsInProject(db, projectId, tableId);
    const ids = new Set(columns.map(column => String(column.id)));
    const start = await nextRowIndex(db, tableId); const prepared = [];
    for (const [index, row] of rows.entries()) {
      const cells = validateCells(row.data ?? {}, ids, columns, true);
      if (!cells.ok) { await db.query('ROLLBACK'); return { status: 400, message: cells.message }; }
      prepared.push({ rowIndex: typeof row.rowIndex === 'number' ? row.rowIndex : start + index, data: cells.data });
    }
    const created = await insertRowsInProject(db, projectId, tableId, prepared);
    if ('status' in created) { await db.query('ROLLBACK'); return created; }
    if (created.length !== prepared.length) { await db.query('ROLLBACK'); return { status: 409, message: 'Не все строки записаны; пакет отменён' }; }
    await db.query('COMMIT'); return created;
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
