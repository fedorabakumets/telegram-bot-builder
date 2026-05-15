/**
 * @fileoverview Хук состояния таблиц — spreadsheet-подобное управление
 * @module editor/tables/hooks/use-tables-state
 */

import { useState, useCallback } from 'react';
import type { BotTable, TableColumn, TableRow } from '../types';

/** Генерирует короткий уникальный ID */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Количество пустых строк при создании таблицы */
const INITIAL_ROWS = 10;

/**
 * Создаёт пустые строки с автоинкрементом ID
 * @param startId - Начальный ID
 * @param count - Количество строк
 * @returns Массив пустых строк
 */
function createEmptyRows(startId: number, count: number): TableRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    cells: {},
  }));
}

/**
 * Хук управления состоянием таблиц проекта
 * @param _projectId - Идентификатор проекта (для будущего API)
 * @returns Состояние и методы управления таблицами
 */
export function useTablesState(_projectId: number) {
  /** Список таблиц */
  const [tables, setTables] = useState<BotTable[]>([]);
  /** ID выбранной таблицы */
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  /** Выбранная таблица */
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  /** Создать новую таблицу с 10 пустыми строками */
  const createTable = useCallback((name: string) => {
    const newTable: BotTable = {
      id: uid(),
      name,
      columns: [],
      rows: createEmptyRows(1, INITIAL_ROWS),
      nextRowId: INITIAL_ROWS + 1,
    };
    setTables((prev) => [...prev, newTable]);
    setSelectedTableId(newTable.id);
  }, []);

  /** Удалить таблицу */
  const deleteTable = useCallback((tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setSelectedTableId((prev) => (prev === tableId ? null : prev));
  }, []);

  /** Переименовать таблицу */
  const renameTable = useCallback((tableId: string, name: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, name } : t))
    );
  }, []);

  /** Добавить именованную колонку */
  const addColumn = useCallback((tableId: string, name: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: [...t.columns, { id: uid(), name }] }
          : t
      )
    );
  }, []);

  /** Добавить 26 буквенных колонок (A-Z) */
  const addAlphabetColumns = useCallback((tableId: string) => {
    const letters = Array.from({ length: 26 }, (_, i) =>
      String.fromCharCode(65 + i)
    );
    const newCols: TableColumn[] = letters.map((l) => ({ id: uid(), name: l }));
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: [...t.columns, ...newCols] }
          : t
      )
    );
  }, []);

  /** Переименовать колонку */
  const renameColumn = useCallback((tableId: string, columnId: string, name: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: t.columns.map((c) => (c.id === columnId ? { ...c, name } : c)) }
          : t
      )
    );
  }, []);

  /** Удалить колонку и данные из строк */
  const deleteColumn = useCallback((tableId: string, columnId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: t.columns.filter((c) => c.id !== columnId),
          rows: t.rows.map((r) => {
            const cells = { ...r.cells };
            delete cells[columnId];
            return { ...r, cells };
          }),
        };
      })
    );
  }, []);

  /** Добавить N строк (по умолчанию 1) */
  const addRows = useCallback((tableId: string, count = 1) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const newRows = createEmptyRows(t.nextRowId, count);
        return { ...t, rows: [...t.rows, ...newRows], nextRowId: t.nextRowId + count };
      })
    );
  }, []);

  /** Удалить строку */
  const deleteRow = useCallback((tableId: string, rowId: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, rows: t.rows.filter((r) => r.id !== rowId) }
          : t
      )
    );
  }, []);

  /** Перезаписать ID строк (1, 2, 3...) */
  const reindexRows = useCallback((tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const rows = t.rows.map((r, i) => ({ ...r, id: i + 1 }));
        return { ...t, rows, nextRowId: rows.length + 1 };
      })
    );
  }, []);

  /** Обновить значение ячейки */
  const updateCell = useCallback(
    (tableId: string, rowId: number, columnId: string, value: string) => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            rows: t.rows.map((r) =>
              r.id === rowId ? { ...r, cells: { ...r.cells, [columnId]: value } } : r
            ),
          };
        })
      );
    },
    []
  );

  return {
    tables,
    selectedTable,
    selectedTableId,
    setSelectedTableId,
    createTable,
    deleteTable,
    renameTable,
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
