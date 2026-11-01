/** @fileoverview Предварительный расчёт замены текста и вставки диапазона. */
import { validateColumnValue } from '@shared/table-column-settings';
import type { TableCellEdit } from '@shared/table-cell-edit';
import type { BotTable, TableRow } from '../types';
import { parseClipboardTsv } from './parse-clipboard';
/** План изменения с ошибками до отправки на сервер. */
export interface CellEditPlan {
  /** Изменяемые ячейки с исходными значениями. */
  edits: TableCellEdit[];
  /** Ошибки размера или защищённых столбцов. */
  errors: string[];
}
/**
 * Проверяет доступность столбца для редактирования.
 * @param table - Таблица проекта.
 * @param columnId - Идентификатор столбца.
 * @returns Разрешено ли менять столбец.
 */
export function editableColumn(table: BotTable, columnId: string): boolean {
  return table.name !== '_content' || table.columns.find((column) => column.id === columnId)?.name === 'value';
}
/**
 * Считает точную замену текста в выбранных строках без изменения исходных данных.
 * @param table - Снимок таблицы перед предпросмотром.
 * @param rows - Целевые строки.
 * @param find - Текст поиска.
 * @param replacement - Новый текст.
 * @param columnId - Ограничение столбца или пустая строка для всех доступных.
 * @returns Полный план замены.
 */
export function replacementPlan(table: BotTable, rows: TableRow[], find: string, replacement: string, columnId: string): CellEditPlan {
  const edits: TableCellEdit[] = [];
  if (!find) return { edits, errors: [] };
  for (const row of rows) for (const column of table.columns) {
    if (!editableColumn(table, column.id) || (columnId && columnId !== column.id)) continue;
    const before = row.cells[column.id] ?? '';
    const after = before.split(find).join(replacement);
    if (before !== after) edits.push({ rowId: row.id, columnId: column.id, before, after });
  }
  const errors = edits.length > 5000 ? ['За одну операцию можно изменить не более 5000 ячеек'] : [];
  if (edits.some((edit) => edit.after.length > 10000)) errors.push('Значение ячейки не должно превышать 10000 символов');
  return { edits, errors: [...errors, ...editValueErrors(table, edits)] };
}
/**
 * Накладывает вставляемый диапазон на видимые строки от выбранной ячейки.
 * @param table - Снимок таблицы.
 * @param rows - Видимые строки в текущем порядке.
 * @param rowId - Начальная строка.
 * @param columnId - Начальный столбец.
 * @param text - TSV диапазон из буфера.
 * @returns Изменения и ошибки выхода за границы.
 */
export function pastePlan(table: BotTable, rows: TableRow[], rowId: number, columnId: string, text: string): CellEditPlan {
  const edits: TableCellEdit[] = [], errors: string[] = [];
  let source: string[][];
  try { source = parseClipboardTsv(text).rows; } catch (error) { return { edits, errors: [error instanceof Error ? error.message : 'Не удалось прочитать диапазон'] }; }
  const rowStart = rows.findIndex((row) => row.id === rowId), colStart = table.columns.findIndex((column) => column.id === columnId);
  if (rowStart < 0 || colStart < 0) return { edits, errors: ['Выберите начальную ячейку диапазона'] };
  source.forEach((values, ri) => values.forEach((after, ci) => {
    const row = rows[rowStart + ri], column = table.columns[colStart + ci];
    if (!row || !column) { errors.push('Диапазон выходит за границы таблицы. Добавьте строки или столбцы.'); return; }
    if (!editableColumn(table, column.id)) { errors.push('Диапазон затрагивает столбцы только для чтения'); return; }
    const before = row.cells[column.id] ?? '';
    if (after !== before) edits.push({ rowId: row.id, columnId: column.id, before, after });
  }));
  if (edits.length > 5000) errors.push('За одну операцию можно изменить не более 5000 ячеек');
  if (edits.some((edit) => edit.after.length > 10000)) errors.push('Значение ячейки не должно превышать 10000 символов');
  return { edits, errors: [...new Set([...errors, ...editValueErrors(table, edits)])] };
}

/**
 * Находит нарушения ограничений столбцов до подтверждения диапазона.
 * @param table - Таблица с настройками типов.
 * @param edits - Планируемые изменения.
 * @returns Ошибки с указанием строки и столбца.
 */
function editValueErrors(table: BotTable, edits: TableCellEdit[]): string[] {
  return edits.flatMap((edit) => {
    const column = table.columns.find((item) => item.id === edit.columnId);
    const error = validateColumnValue(edit.after, column?.settings);
    return error ? [`Строка ${table.rows.find((row) => row.id === edit.rowId)?.rowIndex}, ${column?.settings?.displayName || column?.name}: ${error}`] : [];
  });
}
