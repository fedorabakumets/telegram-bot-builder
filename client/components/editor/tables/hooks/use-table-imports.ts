/** @fileoverview Импорт таблиц и строк с сохранением порядка столбцов. */
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import * as api from '../api/tables-api';
import { tableKeys } from './use-tables-query';
/**
 * Подготавливает операции импорта текущего проекта.
 * @param projectId - Проект пользователя.
 * @param serverColumns - Столбцы выбранной таблицы.
 * @param setSelectedTableId - Выбор созданной таблицы.
 * @returns Импорт новой таблицы и добавление строк.
 */
export function useTableImports(projectId: number, serverColumns: Awaited<ReturnType<typeof api.fetchColumns>>, setSelectedTableId: (id: string) => void) {
  const queryClient = useQueryClient();
  /** Создаёт таблицу и связывает значения с реальными идентификаторами столбцов. */
  async function importNewTable(name: string, columns: string[], rows: string[][]) {
    const result = await apiRequest('POST', `/api/projects/${projectId}/tables/import`, { mode: 'create', tables: [{ name, columns, rows }] });
    const table = { id: result.tables[0].tableId as number };
    setSelectedTableId(String(table.id));
    await queryClient.invalidateQueries({ queryKey: tableKeys.tables(projectId) });
    await queryClient.invalidateQueries({ queryKey: tableKeys.columns(projectId, table.id) });
    await queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, table.id) });
  }
  /** Добавляет данные по порядку существующих столбцов. */
  async function importRows(tableId: string, rows: string[][]) {
    const columns = [...serverColumns].sort((a, b) => a.position - b.position);
    const mapped = rows.map((row) => Object.fromEntries(columns.map((column, ci) => [String(column.id), row[ci] ?? ''])));
    await apiRequest('POST', `/api/projects/${projectId}/tables/${tableId}/rows/import`, { mode: 'append', rows: mapped });
    await queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, Number(tableId)) });
  }
  return { importNewTable, importRows };
}
