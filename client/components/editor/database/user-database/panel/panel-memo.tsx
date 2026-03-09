/**
 * @fileoverview Memo хуки компонента UserDatabasePanel
 * @description useMemo для вычислений
 */

import { useMemo } from 'react';
import { UserBotData } from '@shared/schema';
import { SortField, SortDirection, VariableToQuestionMap, UserMessageCounts } from '../types';

/**
 * Пропсы для хука useVariableToQuestionMap
 */
interface UseVariableToQuestionMapParams {
  /** Данные проекта */
  projectData?: any;
}

/**
 * Пропсы для хука useUserMessageCounts
 */
interface UseUserMessageCountsParams {
  /** Сообщения деталей пользователя */
  userDetailsMessages: any[];
}

/**
 * Пропсы для хука useFilteredAndSortedUsers
 */
interface UseFilteredAndSortedUsersParams {
  /** Список пользователей */
  users: UserBotData[];
  /** Результаты поиска */
  searchResults: UserBotData[];
  /** Поисковый запрос */
  searchQuery: string;
  /** Фильтр по статусу */
  filterActive: boolean | null;
  /** Фильтр по Premium */
  filterPremium: boolean | null;
  /** Фильтр по блокировке */
  filterBlocked: boolean | null;
  /** Поле сортировки */
  sortField: SortField;
  /** Направление сортировки */
  sortDirection: SortDirection;
}

/**
 * Хук для создания карты вопросов
 * @param params - Параметры хука
 * @returns Карта вопросов
 */
export function useVariableToQuestionMap(
  params: UseVariableToQuestionMapParams
): VariableToQuestionMap {
  const { projectData } = params;

  return useMemo(() => {
    const mapping: Record<string, string> = {};
    if (!projectData) return mapping;

    try {
      const flowData = typeof projectData === 'string'
        ? JSON.parse(projectData)
        : projectData;

      const sheets = flowData?.sheets || [];
      for (const sheet of sheets) {
        const nodes = sheet?.nodes || [];
        for (const node of nodes) {
          const data = node?.data;
          if (!data) continue;

          const questionText = data.messageText;
          if (!questionText) continue;

          if (data.inputVariable) {
            mapping[data.inputVariable] = questionText;
          }
          if (data.photoInputVariable) {
            mapping[data.photoInputVariable] = questionText;
          }
          if (data.videoInputVariable) {
            mapping[data.videoInputVariable] = questionText;
          }
          if (data.audioInputVariable) {
            mapping[data.audioInputVariable] = questionText;
          }
          if (data.documentInputVariable) {
            mapping[data.documentInputVariable] = questionText;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing project data for variable mapping:', e);
    }

    return mapping;
  }, [projectData]);
}

/**
 * Хук для подсчёта сообщений пользователя
 * @param params - Параметры хука
 * @returns Количество сообщений
 */
export function useUserMessageCounts(
  params: UseUserMessageCountsParams
): UserMessageCounts {
  const { userDetailsMessages } = params;

  return useMemo(() => {
    if (!userDetailsMessages.length) {
      return { userSent: 0, botSent: 0, total: 0 };
    }
    const userSent = userDetailsMessages.filter(m => m.messageType === 'user').length;
    const botSent = userDetailsMessages.filter(m => m.messageType === 'bot').length;
    return { userSent, botSent, total: userDetailsMessages.length };
  }, [userDetailsMessages]);
}

/**
 * Хук для фильтрации и сортировки пользователей
 * @param params - Параметры хука
 * @returns Отфильтрованный и отсортированный список
 */
export function useFilteredAndSortedUsers(
  params: UseFilteredAndSortedUsersParams
): UserBotData[] {
  const {
    users,
    searchResults,
    searchQuery,
    filterActive,
    filterPremium,
    filterBlocked,
    sortField,
    sortDirection,
  } = params;

  return useMemo(() => {
    let result = searchQuery.length > 0 ? searchResults : users;

    // Apply filters
    if (filterActive !== null) {
      result = result.filter(user => Boolean(user.isActive) === filterActive);
    }
    if (filterPremium !== null) {
      result = result.filter(user => Boolean(user.isPremium) === filterPremium);
    }
    if (filterBlocked !== null) {
      result = result.filter(user => Boolean(user.isBlocked) === filterBlocked);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aValue: any, bValue: any;

      if (sortField === 'lastInteraction') {
        aValue = a.lastInteraction;
        bValue = b.lastInteraction;
      } else if (sortField === 'createdAt') {
        aValue = a.createdAt;
        bValue = b.createdAt;
      } else if (sortField === 'interactionCount') {
        aValue = a.interactionCount;
        bValue = b.interactionCount;
      } else if (sortField === 'firstName') {
        aValue = a.firstName;
        bValue = b.firstName;
      } else if (sortField === 'userName') {
        aValue = a.userName;
        bValue = b.userName;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (sortField === 'lastInteraction' || sortField === 'createdAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [
    users,
    searchResults,
    searchQuery,
    filterActive,
    filterPremium,
    filterBlocked,
    sortField,
    sortDirection,
  ]);
}
