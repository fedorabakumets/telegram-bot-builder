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
  /** Поисковый запрос */
  searchQuery: string;
}

/**
 * Возвращаемые значения хука useUserDatabase
 */
export interface UseUserDatabaseReturn {
  /** Данные проекта */
  project?: BotProject;
  /** Список пользователей */
  users: UserBotData[];
  /** Статистика пользователей */
  stats: UserStats;
  /** Результаты поиска пользователей */
  searchResults: UserBotData[];
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
}
