/**
 * @fileoverview Пропсы компонента DatabaseContent
 * @description Интерфейс пропсов для главного компонента контента БД
 */

import { BotProject, UserBotData } from '@shared/schema';
import { SortField, SortDirection } from '../types';
import { VariableToQuestionMap } from '../types';

/**
 * Пропсы компонента DatabaseContent
 */
export interface DatabaseContentProps {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Флаг включена ли БД */
  isDatabaseEnabled: boolean;
  /** Мутация переключения БД */
  toggleDatabaseMutation: any;
  /** Функция обновления */
  handleRefresh: () => void;
  /** Мутация удаления всех */
  deleteAllUsersMutation: any;
  /** Статистика */
  stats: {
    totalUsers?: number;
    activeUsers?: number;
    blockedUsers?: number;
    premiumUsers?: number;
    totalInteractions?: number;
    avgInteractionsPerUser?: number;
    usersWithResponses?: number;
  };
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция изменения поискового запроса */
  setSearchQuery: (value: string) => void;
  /** Фильтр по статусу */
  filterActive: boolean | null;
  /** Установка фильтра статуса */
  setFilterActive: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Фильтр по Premium */
  filterPremium: boolean | null;
  /** Установка фильтра Premium */
  setFilterPremium: React.Dispatch<React.SetStateAction<boolean | null>>;
  /** Поле сортировки */
  sortField: SortField;
  /** Направление сортировки */
  sortDirection: SortDirection;
  /** Установка поля сортировки */
  setSortField: React.Dispatch<React.SetStateAction<SortField>>;
  /** Установка направления сортировки */
  setSortDirection: React.Dispatch<React.SetStateAction<SortDirection>>;
  /** Флаг мобильного режима */
  isMobile: boolean;
  /** Список пользователей */
  filteredAndSortedUsers: UserBotData[];
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Открытие панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Открытие диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Переключение статуса */
  handleUserStatusToggle: (
    user: UserBotData,
    field: 'isActive' | 'isBlocked' | 'isPremium'
  ) => void;
  /** Мутация удаления */
  deleteUserMutation: any;
  /** Данные проекта */
  project?: BotProject;
  /** Карта вопросов для ответов */
  variableToQuestionMap?: VariableToQuestionMap;
  /** Количество видимых колонок */
  visibleColumns?: number;
}
