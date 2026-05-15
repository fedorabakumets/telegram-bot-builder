/**
 * @fileoverview React-query хуки для загрузки данных таблиц
 * @module editor/tables/hooks/use-tables-query
 */

import { useQuery } from '@tanstack/react-query';
import { fetchTables, fetchColumns, fetchRows } from '../api/tables-api';

/** Ключи кеша для таблиц */
export const tableKeys = {
  /** Список таблиц проекта */
  tables: (projectId: number) => ['bot-tables', projectId] as const,
  /** Колонки таблицы */
  columns: (projectId: number, tableId: number) =>
    ['bot-table-columns', projectId, tableId] as const,
  /** Строки таблицы */
  rows: (projectId: number, tableId: number) =>
    ['bot-table-rows', projectId, tableId] as const,
};

/**
 * Загрузка списка таблиц проекта
 * @param projectId - ID проекта
 * @returns Результат запроса со списком таблиц
 */
export function useTablesQuery(projectId: number) {
  return useQuery({
    queryKey: tableKeys.tables(projectId),
    queryFn: () => fetchTables(projectId),
    enabled: !!projectId,
  });
}

/**
 * Загрузка колонок таблицы
 * @param projectId - ID проекта
 * @param tableId - ID таблицы
 * @returns Результат запроса с колонками
 */
export function useColumnsQuery(projectId: number, tableId: number | null) {
  return useQuery({
    queryKey: tableKeys.columns(projectId, tableId!),
    queryFn: () => fetchColumns(projectId, tableId!),
    enabled: !!projectId && !!tableId,
  });
}

/**
 * Загрузка строк таблицы
 * @param projectId - ID проекта
 * @param tableId - ID таблицы
 * @returns Результат запроса со строками
 */
export function useRowsQuery(projectId: number, tableId: number | null) {
  return useQuery({
    queryKey: tableKeys.rows(projectId, tableId!),
    queryFn: () => fetchRows(projectId, tableId!),
    enabled: !!projectId && !!tableId,
  });
}
