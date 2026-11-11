/**
 * @fileoverview Типы для хука useUserDatabase
 * @description Интерфейсы параметров и возвращаемых значений главного хука
 */

import { BotProject, UserBotData } from '@shared/schema';
import { UserStats } from '../../types';

/**
 * Параметры хука useUserDatabase
 */
export interface UseUserDatabaseParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Поисковый запрос (передаётся на сервер) */
  searchQuery: string;
  /** Фильтр по активности: true — активные, false — неактивные, null — все */
  filterActive?: boolean | null;
  /** Поле сортировки */
  sortField?: string;
  /** Направление сортировки */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Возвращаемые значения хука useUserDatabase
 */
export interface UseUserDatabaseReturn {
  /** Данные проекта */
  project?: BotProject;
  /** Ошибка загрузки пользователей */
  usersError?: Error | null;
  /** Загрузка списка пользователей */
  isUsersPending?: boolean;
  /** Список пользователей (все загруженные страницы) */
  users: UserBotData[];
  /** Статистика пользователей */
  stats: UserStats;
  /** Общее состояние загрузки */
  isLoading: boolean;
  /** Состояние загрузки пользователей */
  isUsersLoading: boolean;
  /** Состояние загрузки статистики */
  isStatsLoading: boolean;
  /** Функция обновления списка пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
  /** Загрузить следующую страницу пользователей */
  fetchNextPage: () => void;
  /** Есть ли следующая страница */
  hasNextPage: boolean;
  /** Идёт ли загрузка следующей страницы */
  isFetchingNextPage: boolean;
}
