/**
 * @fileoverview Хук бесконечной прокрутки для списка пользователей
 * @description Загружает пользователей страницами по 50 с поддержкой серверного поиска,
 * фильтрации и сортировки через useInfiniteQuery
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/** Размер одной страницы пользователей */
const PAGE_SIZE = 50;

/**
 * Ответ сервера при пагинации
 */
interface UsersPageResponse {
  /** Список пользователей на странице */
  users: UserBotData[];
  /** Общее количество пользователей */
  total: number;
  /** Есть ли ещё страницы */
  hasMore: boolean;
}

/**
 * Параметры хука useInfiniteUsers
 */
interface UseInfiniteUsersParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Строка поиска по имени, username, user_id */
  search?: string;
  /** Фильтр по активности: true — активные, false — неактивные, null — все */
  filterActive?: boolean | null;
  /** Поле сортировки */
  sortBy?: string;
  /** Направление сортировки */
  sortDir?: 'asc' | 'desc';
  /** Включать группы в список диалогов */
  includeGroups?: boolean;
}

/**
 * Результат хука useInfiniteUsers
 */
export interface UseInfiniteUsersResult {
  /** Все загруженные пользователи (объединение всех страниц) */
  allUsers: UserBotData[];
  /** Загрузить следующую страницу */
  fetchNextPage: () => void;
  /** Есть ли следующая страница */
  hasNextPage: boolean;
  /** Идёт ли загрузка следующей страницы */
  isFetchingNextPage: boolean;
  /** Идёт ли первоначальная загрузка */
  isLoading: boolean;
  /** Функция сброса и перезагрузки с начала */
  refetch: () => void;
}

/**
 * Хук бесконечной прокрутки пользователей с серверным поиском, фильтрацией и сортировкой
 * @param params - Параметры хука
 * @returns Объект с данными и функциями управления пагинацией
 */
export function useInfiniteUsers(params: UseInfiniteUsersParams): UseInfiniteUsersResult {
  const { projectId, selectedTokenId, search, filterActive, sortBy, sortDir, includeGroups } = params;

  const basePath = `/api/projects/${projectId}/users`;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<UsersPageResponse>({
    queryKey: ['infinite-users', projectId, selectedTokenId, search, filterActive, sortBy, sortDir, includeGroups],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const extraParams: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (search) extraParams.search = search;
      if (filterActive !== null && filterActive !== undefined) {
        extraParams.filterActive = String(filterActive);
      }
      if (sortBy) extraParams.sortBy = sortBy;
      if (sortDir) extraParams.sortDir = sortDir;
      if (includeGroups) extraParams.includeGroups = 'true';

      const url = buildUsersApiUrl(basePath, selectedTokenId, extraParams);
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<UsersPageResponse>;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((sum, page) => sum + page.users.length, 0);
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 30_000,
    retry: false,
  });

  const allUsers = data?.pages.flatMap((page) => page.users) ?? [];

  return {
    allUsers,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    refetch,
  };
}
