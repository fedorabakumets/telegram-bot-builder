/**
 * @fileoverview Главный хук для загрузки данных базы пользователей
 * @description Агрегирует query-хуки с поддержкой серверного поиска, фильтрации и сортировки
 */

import { UseUserDatabaseParams, UseUserDatabaseReturn } from './types';
import { useEffect } from 'react';
import { useProject } from './queries/use-project';
import { useInfiniteUsers } from './queries/use-infinite-users';
import { useStats } from './queries/use-stats';

/**
 * Хук для загрузки всех данных базы пользователей
 * @param params - Параметры хука
 * @returns Объект с данными и функциями обновления
 */
export function useUserDatabase(params: UseUserDatabaseParams): UseUserDatabaseReturn {
  const { projectId, selectedTokenId, searchQuery, filterActive, sortField, sortDirection } = params;

  const { project } = useProject({ projectId });
  const {
    allUsers,
    usersError,
    isLoading: isUsersLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers({
    projectId,
    selectedTokenId,
    search: searchQuery,
    filterActive,
    sortBy: sortField,
    sortDir: sortDirection,
    privateContactsOnly: true,
  });
  /** Защищает список при работе с сервером, ещё не поддерживающим новый параметр фильтра. */
  const users = allUsers.filter((user) => Boolean(user.lastMessageAt));
  useEffect(() => {
    if (allUsers.length > 0 && users.length === 0 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [allUsers.length, users.length, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { stats, isStatsLoading, refetchStats } = useStats({ projectId, selectedTokenId });
  const isLoading = isUsersLoading || isStatsLoading;

  return {
    project,
    users,
    usersError,
    isUsersPending: isUsersLoading,
    stats,
    isLoading,
    isUsersLoading,
    isStatsLoading,
    refetchUsers: refetch,
    refetchStats,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
