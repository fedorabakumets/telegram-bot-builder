/**
 * @fileoverview Главный хук для загрузки данных базы данных пользователей
 * @description Агрегирует все useQuery хуки для получения данных о пользователях
 */

import { UseUserDatabaseParams, UseUserDatabaseReturn } from './types';
import { useProject } from './queries/use-project';
import { useUsers } from './queries/use-users';
import { useStats } from './queries/use-stats';
import { useSearchUsers } from './queries/use-search-users';

/**
 * Хук для загрузки всех данных базы данных пользователей
 * @param params - Параметры хука
 * @returns Объект с данными и функциями обновления
 */
export function useUserDatabase(params: UseUserDatabaseParams): UseUserDatabaseReturn {
  const {
    projectId,
    searchQuery,
  } = params;

  const { project } = useProject({ projectId });

  const { users, isUsersLoading, refetchUsers } = useUsers({ projectId });

  const { stats, isStatsLoading, refetchStats } = useStats({ projectId });

  const { searchResults } = useSearchUsers({ projectId, searchQuery });

  const isLoading = isUsersLoading || isStatsLoading;

  return {
    project,
    users,
    stats,
    searchResults,
    isLoading,
    isUsersLoading,
    isStatsLoading,
    refetchUsers,
    refetchStats,
  };
}
