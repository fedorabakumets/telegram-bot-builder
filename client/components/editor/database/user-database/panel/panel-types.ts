/**
 * @fileoverview Типы для компонентов панели
 * @description Интерфейсы пропсов и параметров панели базы пользователей
 */

import { SortField, SortDirection } from '../types';

/**
 * Пропсы для хука useUserDatabase
 */
export interface UseUserDatabaseParams {
  /** ID проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Поисковый запрос */
  searchQuery: string;
}

/**
 * Пропсы для хука useUserMutations
 */
export interface UseUserMutationsParams {
  /** ID проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
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
  /** Поле сортировки */
  sortField: SortField;
  /** Направление сортировки */
  sortDirection: SortDirection;
  /** Фильтр по статусу */
  filterActive: boolean | null;
  /** Фильтр по Premium */
  filterPremium: boolean | null;
}

/**
 * Сеттеры стейта
 */
export interface UserDatabasePanelSetters {
  /** Установка поискового запроса */
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  /** Установка поля сортировки */
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;
  /** Установка направления сортировки */
  setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
  /** Установка фильтра по статусу */
  setFilterActive: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Установка фильтра по Premium */
  setFilterPremium: React.Dispatch<React.SetStateAction<boolean | null>>;
}
