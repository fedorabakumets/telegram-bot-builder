/** @fileoverview Атомарное сохранение ячеек и сценария с проверкой исходных значений. */
import { columnSettings, validateColumnValue } from '../../../shared/table-column-settings';
import type { Queryable } from './queryable';
import type { TableCellEdit } from '../../../shared/table-cell-edit';
import { mapRow, type RowRecord } from './map-records';
import { extractContentFromNodes } from '../../services/content-table/content-key-parser';
import { applyContentValue, type ContentScenario } from '../../services/content-table/apply-content-value';
/** Ошибка проверяемой операции с кодом ответа для пользователя. */
export class TableEditError extends Error {
  /** Код отказа. */
  status: number;
  /** Создаёт отказ без частичного сохранения данных. */
  constructor(status: number, message: string) { super(message); this.status = status; }
}
/**
 * Сохраняет весь диапазон одной транзакцией, проверяя и таблицу, и исходный сценарий.
 * @param db - Выделенное соединение без активной транзакции.
 * @param projectId - Проект пользователя.
 * @param tableId - Таблица проекта.
 * @param edits - Ячейки с ожидаемыми значениями.
 * @returns Изменённые строки.
 */
export async function applyCellEdits(db: Queryable, projectId: number, tableId: number, edits: TableCellEdit[]): Promise<RowRecord[]> {
  await db.query('BEGIN');
  try {
    const project = await db.query('SELECT data FROM bot_projects WHERE id = $1 FOR UPDATE', [projectId]);
    const tables = await db.query('SELECT name FROM bot_tables WHERE id = $1 AND project_id = $2 FOR UPDATE', [tableId, projectId]);
    if (!project.rows[0] || !tables.rows[0]) throw new TableEditError(404, 'Таблица не найдена');
    const columns = await db.query('SELECT id, name, settings FROM bot_table_columns WHERE table_id = $1', [tableId]);
    const names = new Map(columns.rows.map((column) => [String(column.id), String(column.name)]));
    const settings = new Map(columns.rows.map((column) => [String(column.id), columnSettings(column.settings)]));
    const content = tables.rows[0].name === '_content';
    const ids = [...new Set(edits.map((edit) => edit.rowId))].sort((a, b) => a - b);
    const locked = await db.query('SELECT id, table_id, row_index, data FROM bot_table_rows WHERE table_id = $1 AND id = ANY($2::int[]) ORDER BY id FOR UPDATE', [tableId, ids]);
    const rows = new Map(locked.rows.map((row) => [Number(row.id), mapRow(row as never)]));
    const scenario = project.rows[0].data as ContentScenario;
    const entries = content ? new Map(extractContentFromNodes(scenario.sheets ?? []).map((entry) => [entry.key, entry])) : new Map();
    const seen = new Set<string>();
    for (const edit of edits) {
      const cellKey = `${edit.rowId}:${edit.columnId}`;
      if (seen.has(cellKey)) throw new TableEditError(400, 'Ячейка повторяется в запросе');
      seen.add(cellKey);
      const name = names.get(edit.columnId);
      if (!name || (content && name !== 'value')) throw new TableEditError(400, 'Столбец недоступен для изменения');
      const error = validateColumnValue(edit.after, settings.get(edit.columnId));
      if (error) throw new TableEditError(400, `${settings.get(edit.columnId)?.displayName || name}: ${error}`);
      const row = rows.get(edit.rowId);
      if (!row || (row.data[edit.columnId] ?? '') !== edit.before) throw new TableEditError(409, 'Данные изменились или строка удалена. Обновите предпросмотр перед сохранением.');
      if (content) {
        const normalized = Object.fromEntries(Object.entries(row.data).map(([id, value]) => [names.get(id) ?? id, value]));
        const entry = entries.get(normalized.key);
        if (!entry || entry.value !== edit.before) throw new TableEditError(409, 'Исходная нода изменилась или удалена. Обновите данные сценария.');
        if (!applyContentValue(scenario, normalized.key, normalized.type, edit.after)) throw new TableEditError(409, 'Поле ноды больше не найдено');
      }
      row.data[edit.columnId] = edit.after;
    }
    for (const row of rows.values()) await db.query('UPDATE bot_table_rows SET data = $2::jsonb WHERE id = $1', [row.id, JSON.stringify(row.data)]);
    /** Изменение контента увеличивает ревизию сценария в той же транзакции для обнаружения конфликтов. */
    if (content) await db.query('UPDATE bot_projects SET data = $2::jsonb, updated_at = NOW(), revision = revision + 1 WHERE id = $1', [projectId, JSON.stringify(scenario)]);
    await db.query('COMMIT');
    return [...rows.values()];
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
