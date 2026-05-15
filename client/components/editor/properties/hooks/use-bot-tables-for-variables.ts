/**
 * @fileoverview Хук загрузки таблиц проекта для селектора переменных
 * @module editor/properties/hooks/use-bot-tables-for-variables
 */

import { useQuery } from '@tanstack/react-query';
import { fetchTables, fetchColumns } from '../../tables/api/tables-api';
import type { BotTableForVariables } from '../utils/variables-utils';

/**
 * Загружает таблицы проекта с колонками для использования в селекторе переменных.
 * Формат переменных: {table.имя_таблицы.имя_колонки}
 * @param projectId - ID проекта
 * @returns Массив таблиц с колонками
 */
export function useBotTablesForVariables(projectId: number): BotTableForVariables[] {
  /** Загружаем список таблиц проекта */
  const { data: tables = [] } = useQuery({
    queryKey: ['bot-tables-for-vars', projectId],
    queryFn: () => fetchTables(projectId),
    enabled: !!projectId,
    staleTime: 30000,
  });

  /** Загружаем колонки для каждой таблицы */
  const { data: allColumns = [] } = useQuery({
    queryKey: ['bot-table-columns-all', projectId, tables.map(t => t.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        tables.map(t => fetchColumns(projectId, t.id))
      );
      return tables.map((t, i) => ({ tableId: t.id, tableName: t.name, columns: results[i] }));
    },
    enabled: tables.length > 0,
    staleTime: 30000,
  });

  return allColumns.map(({ tableName, columns }) => ({
    name: tableName,
    columns: columns.map(c => ({ id: c.id, name: c.name })),
  }));
}
