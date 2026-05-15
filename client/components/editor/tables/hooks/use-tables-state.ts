/**
 * @fileoverview Хук локального состояния таблиц (заглушка до подключения API)
 * @module editor/tables/hooks/use-tables-state
 */

import { useState, useCallback } from 'react';
import type { BotTable, TableColumn, TableRow } from '../types';

/** Генерирует короткий уникальный ID */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
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

  /** Создать новую таблицу */
  const createTable = useCallback((name: string) => {
    const newTable: BotTable = {
      id: uid(),
      name,
      columns: [{ id: uid(), name: 'name', type: 'text' }],
      rows: [],
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

  /** Добавить колонку */
  const addColumn = useCallback((tableId: string, column: Omit<TableColumn, 'id'>) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: [...t.columns, { ...column, id: uid() }] }
          : t
      )
    );
  }, []);

  /** Удалить колонку */
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

  /** Добавить строку */
  const addRow = useCallback((tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const cells: Record<string, string | number | boolean> = {};
        t.columns.forEach((col) => {
          cells[col.id] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : '';
        });
        const newRow: TableRow = { id: uid(), cells };
        return { ...t, rows: [...t.rows, newRow] };
      })
    );
  }, []);

  /** Удалить строку */
  const deleteRow = useCallback((tableId: string, rowId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, rows: t.rows.filter((r) => r.id !== rowId) }
          : t
      )
    );
  }, []);

  /** Обновить значение ячейки */
  const updateCell = useCallback(
    (tableId: string, rowId: string, columnId: string, value: string | number | boolean) => {
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
    deleteColumn,
    addRow,
    deleteRow,
    updateCell,
  };
}
