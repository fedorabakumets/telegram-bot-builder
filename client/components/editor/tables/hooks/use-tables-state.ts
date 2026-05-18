/**
 * @fileoverview Хук состояния таблиц — мост между react-query и компонентами
 * @module editor/tables/hooks/use-tables-state
 */

import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTablesQuery, useColumnsQuery, useRowsQuery, tableKeys } from './use-tables-query';
import {
  useCreateTable,
  useDeleteTable,
  useCreateColumn,
  useDeleteColumn,
  useRenameColumn,
  useCreateRows,
  useUpdateRow,
  useDeleteRow,
  useReindexRows,
} from './use-tables-mutations';
import { useSystemTables } from './use-system-tables';
import * as api from '../api/tables-api';
import type { BotTable, TableColumn, TableRow } from '../types';

/** Количество пустых строк при создании таблицы */
const INITIAL_ROWS = 10;

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
  const { data: serverColumns = [] } = useColumnsQuery(projectId, numericTableId);
  const { data: serverRows = [] } = useRowsQuery(projectId, numericTableId);

  /** Мутации */
  const createTableMut = useCreateTable(projectId);
  const deleteTableMut = useDeleteTable(projectId);
  const createColumnMut = useCreateColumn(projectId);
  const deleteColumnMut = useDeleteColumn(projectId);
  const renameColumnMut = useRenameColumn(projectId);
  const createRowsMut = useCreateRows(projectId);
  const updateRowMut = useUpdateRow(projectId);
  const deleteRowMut = useDeleteRow(projectId);
  const reindexRowsMut = useReindexRows(projectId);

  /** Колонки в клиентском формате */
  const columns: TableColumn[] = useMemo(
    () => serverColumns.map((c) => ({ id: String(c.id), name: c.name })),
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

  /** Создать таблицу с 10 пустыми строками */
  const createTable = useCallback(async (name: string) => {
    const created = await createTableMut.mutateAsync(name);
    setSelectedTableId(String(created.id));
    const emptyRows = Array.from({ length: INITIAL_ROWS }, (_, i) => ({
      rowIndex: i + 1,
      data: {},
    }));
    await createRowsMut.mutateAsync({ tableId: created.id, rows: emptyRows });
  }, [createTableMut, createRowsMut]);

  /** Удалить таблицу */
  const deleteTable = useCallback((tableId: string) => {
    deleteTableMut.mutate(Number(tableId));
    if (selectedTableId === tableId) setSelectedTableId(null);
  }, [deleteTableMut, selectedTableId]);

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

  /** Обновить значение ячейки */
  const updateCell = useCallback(
    (tableId: string, rowId: number, columnId: string, value: string) => {
      const row = serverRows.find((r) => r.id === rowId);
      const newData = { ...(row?.data ?? {}), [columnId]: value };
      updateRowMut.mutate({ tableId: Number(tableId), rowId, data: newData });
    },
    [updateRowMut, serverRows],
  );

  /** Импортировать новую таблицу с колонками и данными */
  const importNewTable = useCallback(async (name: string, columns: string[], rows: string[][]) => {
    const created = await createTableMut.mutateAsync(name);
    const tableId = created.id;

    /** Создаём колонки последовательно (нужен ID каждой) */
    const createdCols = await Promise.all(
      columns.map((colName, i) => api.createColumn(projectId, tableId, colName, i)),
    );

    /** Маппим строки: columns[i] → columnId */
    const mappedRows = rows.map((row, rowIdx) => {
      const data: Record<string, string> = {};
      createdCols.forEach((col, ci) => {
        if (row[ci] !== undefined && row[ci] !== '') {
          data[String(col.id)] = row[ci];
        }
      });
      return { rowIndex: rowIdx + 1, data };
    });

    await createRowsMut.mutateAsync({ tableId, rows: mappedRows });
    setSelectedTableId(String(tableId));
    queryClient.invalidateQueries({ queryKey: tableKeys.columns(projectId, tableId) });
    queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
  }, [createTableMut, createRowsMut, projectId, queryClient]);

  /** Импортировать строки в существующую таблицу */
  const importRows = useCallback(async (tableId: string, rows: string[][]) => {
    const tid = Number(tableId);
    /** Берём текущие колонки по порядку position */
    const sortedCols = [...serverColumns].sort((a, b) => a.position - b.position);
    const maxIndex = serverRows.reduce((max, r) => Math.max(max, r.rowIndex), 0);

    const mappedRows = rows.map((row, rowIdx) => {
      const data: Record<string, string> = {};
      sortedCols.forEach((col, ci) => {
        if (row[ci] !== undefined && row[ci] !== '') {
          data[String(col.id)] = row[ci];
        }
      });
      return { rowIndex: maxIndex + rowIdx + 1, data };
    });

    await createRowsMut.mutateAsync({ tableId: tid, rows: mappedRows });
    queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tid) });
  }, [createRowsMut, serverColumns, serverRows, projectId, queryClient]);

  return {
    tables,
    selectedTable,
    selectedTableId,
    setSelectedTableId,
    createTable,
    deleteTable,
    addColumn,
    addAlphabetColumns,
    renameColumn,
    deleteColumn,
    addRows,
    deleteRow,
    reindexRows,
    updateCell,
    importNewTable,
    importRows,
  };
}
