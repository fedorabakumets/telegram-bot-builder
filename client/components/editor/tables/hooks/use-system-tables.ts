/**
 * @fileoverview Хук загрузки системных (виртуальных) таблиц из существующих API
 * @module editor/tables/hooks/use-system-tables
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotTable, TableColumn, TableRow } from '../types';

/** Колонки системной таблицы пользователей */
const USERS_COLUMNS: TableColumn[] = [
  { id: 'user_id', name: 'user_id' },
  { id: 'username', name: 'username' },
  { id: 'first_name', name: 'first_name' },
  { id: 'last_interaction', name: 'last_interaction' },
  { id: 'interaction_count', name: 'interactions' },
];

/** Интерфейс ответа API пользователей (пагинированный режим) */
interface UsersApiResponse {
  /** Массив пользователей */
  users: any[];
  /** Общее количество */
  total: number;
  /** Есть ли ещё записи */
  hasMore: boolean;
}

/**
 * Хук загрузки системных таблиц (read-only) из существующих API проекта
 * @param projectId - Идентификатор проекта
 * @returns Массив виртуальных BotTable для отображения в списке таблиц
 */
export function useSystemTables(projectId: number): BotTable[] {
  const { data: usersData } = useQuery<UsersApiResponse | any[]>({
    queryKey: ['system-tables-users', projectId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/users?limit=200`),
    enabled: !!projectId,
    refetchInterval: 10000,
  });

  /** Преобразуем данные пользователей в формат BotTable */
  const systemTables = useMemo<BotTable[]>(() => {
    const users = Array.isArray(usersData)
      ? usersData
      : (usersData as UsersApiResponse)?.users || [];

    const usersRows: TableRow[] = users.map((u: any, i: number) => ({
      id: i + 1,
      rowIndex: i + 1,
      cells: {
        user_id: String(u.userId || ''),
        username: u.userName || '',
        first_name: u.firstName || '',
        last_interaction: u.lastInteraction
          ? new Date(u.lastInteraction).toLocaleString('ru')
          : '',
        interaction_count: String(u.interactionCount || 0),
      },
    }));

    return [
      {
        id: '_system_users',
        name: '🔒 Пользователи',
        columns: USERS_COLUMNS,
        rows: usersRows,
      },
    ];
  }, [usersData]);

  return systemTables;
}
