/** @fileoverview Операции структуры таблицы: столбцы, строки и создание таблиц. */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import * as api from '../api/tables-api';
import { tableKeys } from './use-tables-query';
import { useDeleteTable, useCreateColumn, useDeleteColumn, useRenameColumn, useCreateRows, useDeleteRow, useReindexRows } from './use-tables-mutations';
/** Число строк и столбцов новой таблицы. */
const INITIAL_SIZE = 10;
/**
 * Управляет структурой текущей таблицы, не затрагивая сохранение ячеек.
 * @param projectId - Проект пользователя.
 * @param serverTables - Список таблиц.
 * @param serverColumns - Столбцы выбранной таблицы.
 * @param serverRows - Строки выбранной таблицы.
 * @param selectedTableId - Выбранная таблица.
 * @param setSelectedTableId - Изменение выбранной таблицы.
 * @returns Обработчики структуры таблицы.
 */
export function useTableStructure(projectId: number, serverTables: Awaited<ReturnType<typeof api.fetchTables>>, serverColumns: Awaited<ReturnType<typeof api.fetchColumns>>, serverRows: Awaited<ReturnType<typeof api.fetchRows>>, selectedTableId: string | null, setSelectedTableId: (id: string | null) => void) {
  const queryClient = useQueryClient();
  const deleteTableMut = useDeleteTable(projectId);
  const createColumnMut = useCreateColumn(projectId);
  const deleteColumnMut = useDeleteColumn(projectId);
  const renameColumnMut = useRenameColumn(projectId);
  const createRowsMut = useCreateRows(projectId);
  const deleteRowMut = useDeleteRow(projectId);
  const reindexRowsMut = useReindexRows(projectId);
  /** Создаёт сетку 10 × 10 одним атомарным запросом без промежуточной пустой таблицы. */
  const createTable = useCallback(async (name: string) => {
    const columns = Array.from({ length: INITIAL_SIZE }, (_, index) => String.fromCharCode(65 + index));
    const rows = Array.from({ length: INITIAL_SIZE }, () => Array<string>(INITIAL_SIZE).fill(''));
    const result = await apiRequest('POST', `/api/projects/${projectId}/tables/import`, { mode: 'create', tables: [{ name, columns, rows }] });
    const tableId = result.tables[0].tableId as number;
    setSelectedTableId(String(tableId));
    await queryClient.invalidateQueries({ queryKey: tableKeys.tables(projectId) });
    await queryClient.invalidateQueries({ queryKey: tableKeys.columns(projectId, tableId) });
    await queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
  }, [projectId, queryClient, setSelectedTableId]);

  /** Удалить таблицу (кроме _content) */
  const deleteTable = useCallback((tableId: string) => {
    const table = serverTables.find((t) => String(t.id) === tableId);
    if (table?.name === '_content') return;
    deleteTableMut.mutate(Number(tableId));
    if (selectedTableId === tableId) setSelectedTableId(null);
  }, [deleteTableMut, selectedTableId, serverTables]);

  /** Добавить именованную колонку */
  const addColumn = useCallback((tableId: string, name: string) => {
    const position = serverColumns.length;
    createColumnMut.mutate({ tableId: Number(tableId), name, position });
  }, [createColumnMut, serverColumns.length]);

  /** Добавить 26 буквенных колонок (A-Z) */
  const addAlphabetColumns = useCallback(async (tableId: string) => {
    const tid = Number(tableId);
    const startPos = serverColumns.length;
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    await Promise.all(
      letters.map((l, i) => api.createColumn(projectId, tid, l, startPos + i)),
    );
    queryClient.invalidateQueries({ queryKey: tableKeys.columns(projectId, tid) });
  }, [projectId, serverColumns.length, queryClient]);

  /** Переименовать колонку */
  const renameColumn = useCallback((tableId: string, columnId: string, name: string) => {
    renameColumnMut.mutate({ tableId: Number(tableId), columnId: Number(columnId), name });
  }, [renameColumnMut]);

  /** Удалить колонку */
  const deleteColumn = useCallback((tableId: string, columnId: string) => {
    deleteColumnMut.mutate({ tableId: Number(tableId), columnId: Number(columnId) });
  }, [deleteColumnMut]);

  /** Добавить N строк */
  const addRows = useCallback((tableId: string, count = 1) => {
    const maxIndex = serverRows.reduce((max, r) => Math.max(max, r.rowIndex), 0);
    const newRows = Array.from({ length: count }, (_, i) => ({
      rowIndex: maxIndex + i + 1,
      data: {},
    }));
    createRowsMut.mutate({ tableId: Number(tableId), rows: newRows });
  }, [createRowsMut, serverRows]);

  /** Удалить строку */
  const deleteRow = useCallback((tableId: string, rowId: number) => {
    deleteRowMut.mutate({ tableId: Number(tableId), rowId });
  }, [deleteRowMut]);

  /** Перенумеровать строки */
  const reindexRows = useCallback((tableId: string) => {
    reindexRowsMut.mutate(Number(tableId));
  }, [reindexRowsMut]);

  return { createTable, deleteTable, addColumn, addAlphabetColumns, renameColumn, deleteColumn, addRows, deleteRow, reindexRows };
}
