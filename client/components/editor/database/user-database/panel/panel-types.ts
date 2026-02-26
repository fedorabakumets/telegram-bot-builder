/**
 * @fileoverview Типы для компонентов панели
 * @description Интерфейсы пропсов и параметров
 */

import { UserBotData } from '@shared/schema';
import { SortField, SortDirection } from '../types';

/**
 * Пропсы для хука useUserDatabase
 */
export interface UseUserDatabaseParams {
  /** ID проекта */
  projectId: number;
  /** Поисковый запрос */
  searchQuery: string;
  /** Флаг открытия диалога */
  showDialog: boolean;
  /** Флаг открытия деталей */
  showUserDetails: boolean;
  /** ID пользователя для диалога */
  selectedUserForDialogUserId?: string;
  /** ID пользователя для деталей */
  selectedUserId?: string;
}

/**
 * Пропсы для хука useUserMutations
 */
export interface UseUserMutationsParams {
  /** ID проекта */
  projectId: number;
  /** Функция обновления пользователей */
  refetchUsers: () => void;
  /** Функция обновления статистики */
  refetchStats: () => void;
}

/**
 * Стейт компонента UserDatabasePanel
 */
export interface UserDatabasePanelState {
  /** Поисковый запрос */
  searchQuery: string;
  /** Выбранный пользователь */
  selectedUser: UserBotData | null;
  /** Флаг показа деталей */
  showUserDetails: boolean;
  /** Поле сортировки */
  sortField: SortField;
  /** Направление сортировки */
  sortDirection: SortDirection;
  /** Фильтр по статусу */
  filterActive: boolean | null;
  /** Фильтр по Premium */
  filterPremium: boolean | null;
  /** Фильтр по блокировке */
  filterBlocked: boolean | null;
  /** Флаг показа диалога */
  showDialog: boolean;
  /** Пользователь для диалога */
  selectedUserForDialog: UserBotData | null;
  /** Текст сообщения */
  messageText: string;
}

/**
 * Сеттеры стейта
 */
export interface UserDatabasePanelSetters {
  /** Установка поискового запроса */
  setSearchQuery: (value: string) => void;
  /** Установка выбранного пользователя */
  setSelectedUser: (user: UserBotData | null) => void;
  /** Установка флага показа деталей */
  setShowUserDetails: (show: boolean) => void;
  /** Установка поля сортировки */
  setSortField: (field: SortField) => void;
  /** Установка направления сортировки */
  setSortDirection: (direction: SortDirection) => void;
  /** Установка фильтра по статусу */
  setFilterActive: (value: boolean | null) => void;
  /** Установка фильтра по Premium */
  setFilterPremium: (value: boolean | null) => void;
  /** Установка флага показа диалога */
  setShowDialog: (show: boolean) => void;
  /** Установка пользователя для диалога */
  setSelectedUserForDialog: (user: UserBotData | null) => void;
  /** Установка текста сообщения */
  setMessageText: (text: string) => void;
}
