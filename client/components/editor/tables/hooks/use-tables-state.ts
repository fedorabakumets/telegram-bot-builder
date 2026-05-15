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
import * as api from '../api/tables-api';
import type { BotTable, TableColumn, TableRow } from '../types';

/** Количество пустых строк при создании таблицы */
const INITIAL_ROWS = 10;

/**
 * Хук управления состоянием таблиц проекта (react-query)
 * @param projectId - Идентификатор проекта
 * @returns Состояние и методы управления таблицами
 */
export function useTablesState(projectId: number) {
  const queryClient = useQueryClient();

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
    () => serverRows.map((r) => ({ id: r.id, cells: r.data ?? {} })),
    [serverRows],
  );

  /** Список таблиц с колонками/строками для выбранной */
  const tables: BotTable[] = useMemo(
    () => serverTables.map((t) => ({
      id: String(t.id),
      name: t.name,
      columns: t.id === numericTableId ? columns : [],
      rows: t.id === numericTableId ? rows : [],
    })),
    [serverTables, numericTableId, columns, rows],
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
  };
}
