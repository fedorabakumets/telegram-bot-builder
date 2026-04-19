/**
 * @fileoverview Главный хук для загрузки данных базы пользователей
 * @description Агрегирует все query-хуки для получения данных о пользователях
 */

import { UseUserDatabaseParams, UseUserDatabaseReturn } from './types';
import { useProject } from './queries/use-project';
import { useUsers } from './queries/use-users';
import { useStats } from './queries/use-stats';
import { useSearchUsers } from './queries/use-search-users';

/**
 * Хук для загрузки всех данных базы пользователей
 * @param params - Параметры хука
 * @returns Объект с данными и функциями обновления
 */
export function useUserDatabase(params: UseUserDatabaseParams): UseUserDatabaseReturn {
  const { projectId, selectedTokenId, searchQuery } = params;

  const { project } = useProject({ projectId });
  const { users, isUsersLoading, refetchUsers } = useUsers({ projectId, selectedTokenId });
  const { stats, isStatsLoading, refetchStats } = useStats({ projectId, selectedTokenId });
  const { searchResults } = useSearchUsers({ projectId, selectedTokenId, searchQuery });
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
