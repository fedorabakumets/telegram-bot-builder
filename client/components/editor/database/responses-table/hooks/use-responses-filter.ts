/**
 * @fileoverview Хук для фильтрации ответов по пользователю
 * @description Управление выбранным пользователем для фильтрации
 */

import { useState, useMemo } from 'react';
import type { UserBotData } from '@shared/schema';

/**
 * Параметры хука useResponsesFilter
 */
interface UseResponsesFilterParams {
  /** Список всех пользователей */
  users: UserBotData[];
}

/**
 * Результат хука useResponsesFilter
 */
interface UseResponsesFilterReturn {
  /** Выбранный пользователь */
  selectedUser: UserBotData | null;
  /** Функция выбора пользователя */
  setSelectedUser: (user: UserBotData | null) => void;
  /** Отфильтрованные пользователи */
  filteredUsers: UserBotData[];
}

/**
 * Хук для фильтрации ответов по пользователю
 * @param params - Параметры хука
 * @returns Объект с данными фильтрации
 */
export function useResponsesFilter(
  params: UseResponsesFilterParams
): UseResponsesFilterReturn {
  const { users } = params;
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(null);

  const filteredUsers = useMemo(() => {
    if (!selectedUser) return users;
    return users.filter((u) => u.id === selectedUser.id);
  }, [users, selectedUser]);

  return {
    selectedUser,
    setSelectedUser,
    filteredUsers,
  };
}
