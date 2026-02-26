/**
 * @fileoverview Типы для хука useUserDatabase
 * @description Интерфейсы параметров и возвращаемых значений главного хука
 */

import { BotProject, UserBotData } from '@shared/schema';
import { BotMessageWithMedia, UserStats } from '../../types';

/**
 * Параметры хука useUserDatabase
 */
export interface UseUserDatabaseParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Поисковый запрос */
  searchQuery: string;
  /** Флаг открытия диалога */
  showDialog: boolean;
  /** Флаг открытия деталей пользователя */
  showUserDetails: boolean;
  /** ID выбранного пользователя для диалога */
  selectedUserForDialogUserId?: string;
  /** ID выбранного пользователя для деталей */
  selectedUserId?: string;
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
  /** Сообщения для диалога */
  messages: BotMessageWithMedia[];
  /** Сообщения для деталей пользователя */
  userDetailsMessages: BotMessageWithMedia[];
  /** Общее состояние загрузки */
  isLoading: boolean;
  /** Состояние загрузки пользователей */
  isUsersLoading: boolean;
  /** Состояние загрузки статистики */
  isStatsLoading: boolean;
  /** Состояние загрузки сообщений */
  isMessagesLoading: boolean;
  /** Функция обновления списка пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
  /** Функция обновления сообщений */
  refetchMessages: () => void;
}
