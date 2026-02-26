/**
 * @fileoverview Типы для компонентов панели
 * @description Интерфейсы пропсов и параметров
 */

import React from 'react';
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
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  /** Установка выбранного пользователя */
  setSelectedUser: React.Dispatch<React.SetStateAction<UserBotData | null>>;
  /** Установка флага показа деталей */
  setShowUserDetails: React.Dispatch<React.SetStateAction<boolean>>;
  /** Установка поля сортировки */
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;
  /** Установка направления сортировки */
  setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
  /** Установка фильтра по статусу */
  setFilterActive: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Установка фильтра по Premium */
  setFilterPremium: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Установка флага показа диалога */
  setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
  /** Установка пользователя для диалога */
  setSelectedUserForDialog: React.Dispatch<React.SetStateAction<UserBotData | null>>;
  /** Установка текста сообщения */
  setMessageText: React.Dispatch<React.SetStateAction<string>>;
}
