/**
 * @fileoverview Хук бесконечной прокрутки для списка пользователей
 * @description Загружает пользователей страницами по 50 с поддержкой серверного поиска,
 * фильтрации и сортировки через useInfiniteQuery
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { UserStatusCounts } from '@shared/user-directory-result';
import type { UserDirectoryResult } from '@shared/user-directory-result';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { useDirectoryControls } from '../../content/user-directory-controls';

/** Размер одной страницы пользователей */
const PAGE_SIZE = 50;

/** Ответ сервера при пагинации. */
interface UsersPageResponse {
  /** Счётчики фильтров по полному списку людей. */
  sourceCounts?: UserDirectoryResult['sourceCounts'];
  /** Счётчики Premium без собственного ограничения. */
  premiumCounts?: UserDirectoryResult['premiumCounts'];
  /** Количества по языкам Telegram. */
  languageCounts?: UserDirectoryResult['languageCounts'];
  /** Количества по статусам во всей области поиска. */
  statusCounts?: UserStatusCounts;
  /** Список пользователей на странице */
  users: UserBotData[];
  /** Общее количество пользователей */
  total: number;
  /** Есть ли ещё страницы */
  hasMore: boolean;
}

/** Параметры загрузки пользователей. */
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
  /** Включать группы в список диалогов (legacy; предпочтительнее dialogKind) */
  includeGroups?: boolean;
  /** Фильтр вкладки «Диалоги»: all | users | groups | channels */
  dialogKind?: 'all' | 'users' | 'groups' | 'channels';
  /** Показывать только пользователей с историей личного общения с ботом. */
  privateContactsOnly?: boolean;
  /** Применять пользовательские фильтры к личным диалогам без изменения области групп и каналов. */
  dialogUserFilters?: boolean;
}

/** Результат постраничной загрузки пользователей. */
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
  /** Ошибка получения списка пользователей */
  usersError: Error | null;
  /** Функция сброса и перезагрузки с начала */
  refetch: () => void;
}

/**
 * Хук бесконечной прокрутки пользователей с серверным поиском, фильтрацией и сортировкой
 * @param params - Параметры хука
 * @returns Объект с данными и функциями управления пагинацией
 */
export function useInfiniteUsers(params: UseInfiniteUsersParams): UseInfiniteUsersResult {
  const {
    projectId,
    selectedTokenId,
    search,
    filterActive,
    sortBy: initialSortBy,
    sortDir: initialSortDir,
    includeGroups,
    dialogKind,
    privateContactsOnly,
    dialogUserFilters,
  } = params;
  /** Диалоги явно подключают общий провайдер; групповые вкладки сохраняют, но не применяют его условия. */
  const controls = useDirectoryControls();
  const useProfileFilters = privateContactsOnly || (dialogUserFilters && dialogKind !== 'groups' && dialogKind !== 'channels');
  const source = useProfileFilters ? controls?.source : '';
  const status = useProfileFilters ? controls?.status ?? 'all' : 'all';
  const premium = useProfileFilters ? controls?.premium ?? 'all' : 'all';
  /** Число ботов фильтруется только в общей области; остальные условия сохраняются при смене бота. */
  const advanced = useProfileFilters ? { ...controls?.advanced, ...(selectedTokenId ? { bots: undefined } : {}) } : {};
  const sortBy = privateContactsOnly ? controls?.field ?? initialSortBy : initialSortBy;
  const sortDir = privateContactsOnly && controls?.field ? controls.direction : initialSortDir;

  const basePath = `/api/projects/${projectId}/users`;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<UsersPageResponse>({
    queryKey: [
      'infinite-users',
      projectId,
      selectedTokenId,
      search,
      filterActive,
      sortBy,
      sortDir,
      includeGroups,
      dialogKind,
      privateContactsOnly,
      dialogUserFilters,
      source,
      status,
      premium,
      advanced,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const extraParams: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (search) extraParams.search = search;
      if (source) extraParams.source = source;
      if (status !== 'all') extraParams.status = status;
      if (premium !== 'all') extraParams.premium = premium;
      if (Object.values(advanced).some(value => value !== undefined)) extraParams.filters = JSON.stringify(advanced);
      if (filterActive !== null && filterActive !== undefined) {
        extraParams.filterActive = String(filterActive);
      }
      if (sortBy) extraParams.sortBy = sortBy;
      if (sortDir) extraParams.sortDir = sortDir;
      if (privateContactsOnly) extraParams.privateContactsOnly = 'true';
      if (dialogUserFilters) extraParams.dialogUserFilters = 'true';
      if (dialogKind) {
        extraParams.dialogKind = dialogKind;
      } else if (includeGroups) {
        extraParams.includeGroups = 'true';
      }

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
  const firstPage = data?.pages[0];
  const setResult = privateContactsOnly || dialogUserFilters ? controls?.setResult : undefined;
  /** Передаёт общий итог без зависимости от количества загруженных страниц. */
  useEffect(() => {
    setResult?.(firstPage ? { total: firstPage.total, statusCounts: firstPage.statusCounts,
      sourceCounts: firstPage.sourceCounts, premiumCounts: firstPage.premiumCounts,
      languageCounts: firstPage.languageCounts } : undefined);
  }, [firstPage, setResult]);
  const allUsers = data?.pages.flatMap((page) => page.users) ?? [];

  return {
    allUsers,
    usersError: error,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    refetch,
  };
}
