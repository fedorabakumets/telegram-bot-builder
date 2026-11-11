/**
 * @fileoverview Хуки компонента UserDatabasePanel
 * @description useUserDatabase и useUserMutations для загрузки данных и мутаций
 */

import { useUserDatabase, useUserMutations } from '../hooks';
import { UseUserDatabaseParams, UseUserMutationsParams } from './panel-types';

/**
 * Параметры хука useUserDatabasePanelData
 */
interface UseUserDatabasePanelDataParams extends UseUserDatabaseParams {
  /** Поисковый запрос */
  searchQuery: string;
  /** Фильтр по активности */
  filterActive?: boolean | null;
  /** Поле сортировки */
  sortField?: string;
  /** Направление сортировки */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Параметры хука useUserDatabasePanelMutations
 */
interface UseUserDatabasePanelMutationsParams extends UseUserMutationsParams {
  /** Функция обновления пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Результат хука useUserDatabasePanelData
 */
interface UseUserDatabasePanelDataReturn {
  /** Данные проекта */
  project: any;
  /** Ошибка загрузки пользователей */
  usersError?: Error | null;
  /** Загрузка списка пользователей */
  isUsersPending?: boolean;
  /** Список пользователей */
  users: any[];
  /** Статистика */
  stats: any;
  /** Флаг загрузки */
  isLoading: boolean;
  /** Функция обновления пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
  /** Загрузить следующую страницу */
  fetchNextPage: () => void;
  /** Есть ли следующая страница */
  hasNextPage: boolean;
  /** Идёт ли загрузка следующей страницы */
  isFetchingNextPage: boolean;
}

/**
 * Результат хука useUserDatabasePanelMutations
 */
interface UseUserDatabasePanelMutationsReturn {
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Мутация обновления пользователя */
  updateUserMutation: any;
  /** Мутация удаления всех пользователей */
  deleteAllUsersMutation: any;
  /** Мутация переключения БД */
  toggleDatabaseMutation: any;
}

/**
 * Хук для загрузки данных панели БД с серверными поиском, фильтрацией и сортировкой
 * @param params - Параметры хука
 * @returns Объект с данными и функциями
 */
export function useUserDatabasePanelData(
  params: UseUserDatabasePanelDataParams
): UseUserDatabasePanelDataReturn {
  const { projectId, selectedTokenId, searchQuery, filterActive, sortField, sortDirection } = params;

  const data = useUserDatabase({
    projectId,
    selectedTokenId,
    searchQuery,
    filterActive,
    sortField,
    sortDirection,
  });

  return {
    project: data.project,
    users: data.users,
    usersError: data.usersError,
    isUsersPending: data.isUsersPending,
    stats: data.stats,
    isLoading: data.isLoading,
    refetchUsers: data.refetchUsers,
    refetchStats: data.refetchStats,
    fetchNextPage: data.fetchNextPage,
    hasNextPage: data.hasNextPage,
    isFetchingNextPage: data.isFetchingNextPage,
  };
}

/**
 * Хук для мутаций панели БД
 * @param params - Параметры хука
 * @returns Объект с мутациями
 */
export function useUserDatabasePanelMutations(
  params: UseUserDatabasePanelMutationsParams
): UseUserDatabasePanelMutationsReturn {
  const { projectId, selectedTokenId, refetchUsers, refetchStats } = params;

  return useUserMutations({
    projectId,
    selectedTokenId,
    refetchUsers,
    refetchStats,
  });
}
