/**
 * @fileoverview Хук состояния таблиц — мост между react-query и компонентами
 * @module editor/tables/hooks/use-tables-state
 */

import { saveCellEdits } from '../api/cell-edits-api';
import type { TableCellEdit } from '@shared/table-cell-edit';
import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTablesQuery, useColumnsQuery, useRowsQuery, tableKeys } from './use-tables-query';
import { useTableStructure } from './use-table-structure';
import { useTableImports } from './use-table-imports';
import { useSystemTables } from './use-system-tables';
import type { BotTable, TableColumn, TableRow } from '../types';

/**
 * Хук управления состоянием таблиц проекта (react-query)
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена бота
 * @returns Состояние и методы управления таблицами
 */
export function useTablesState(projectId: number, selectedTokenId?: number | null) {
  const queryClient = useQueryClient();

  /** Системные (виртуальные) таблицы из API пользователей */
  const systemTables = useSystemTables(projectId, selectedTokenId);

  /** ID выбранной таблицы (строка) */
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  /** Числовой ID выбранной таблицы для запросов */
  const numericTableId = selectedTableId ? Number(selectedTableId) : null;

  /** Запросы данных */
  const { data: serverTables = [] } = useTablesQuery(projectId);
  const { data: serverColumns = [], isLoading: columnsLoading, error: columnsError, refetch: reloadColumns } = useColumnsQuery(projectId, numericTableId);
  const { data: serverRows = [], isLoading: rowsLoading, error: rowsError, refetch: reloadRows } = useRowsQuery(projectId, numericTableId);

  /** Колонки в клиентском формате */
  const columns: TableColumn[] = useMemo(
    () => serverColumns.map((c) => ({ id: String(c.id), name: c.name, settings: c.settings })),
    [serverColumns],
  );

  /** Строки в клиентском формате */
  const rows: TableRow[] = useMemo(
    () => serverRows.map((r) => ({ id: r.id, rowIndex: r.rowIndex, cells: r.data ?? {} })),
    [serverRows],
  );

  /** Список таблиц с колонками/строками для выбранной */
  const tables: BotTable[] = useMemo(
    () => [
      ...systemTables,
      ...serverTables.map((t) => ({
        id: String(t.id),
        name: t.name,
        columns: t.id === numericTableId ? columns : [],
        rows: t.id === numericTableId ? rows : [],
      })),
    ],
    [systemTables, serverTables, numericTableId, columns, rows],
  );

  /** Выбранная таблица */
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  const structure = useTableStructure(projectId, serverTables, serverColumns, serverRows, selectedTableId, setSelectedTableId);

  /** Сохраняет все ячейки одной операцией с проверкой исходных значений. */
  const updateCells = useCallback(async (tableId: string, edits: TableCellEdit[]) => {
    await saveCellEdits(projectId, tableId, edits);
    await queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, Number(tableId)) });
    await queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
  }, [projectId, queryClient]);
  /** Сохраняет одну ячейку через тот же атомарный механизм. */
  const updateCell = useCallback(async (tableId: string, rowId: number, columnId: string, after: string, before?: string) => {
    const row = serverRows.find((item) => item.id === rowId);
    await updateCells(tableId, [{ rowId, columnId, after, before: before ?? row?.data?.[columnId] ?? '' }]);
  }, [updateCells, serverRows]);

  const { importNewTable, importRows } = useTableImports(projectId, serverColumns, setSelectedTableId);
  return { loading: columnsLoading || rowsLoading, loadError: columnsError || rowsError ? 'Не удалось обновить данные таблицы' : '', retryLoad: () => { void reloadColumns(); void reloadRows(); }, ...structure, tables, selectedTable, selectedTableId, setSelectedTableId, updateCell, updateCells, importNewTable, importRows };
}
