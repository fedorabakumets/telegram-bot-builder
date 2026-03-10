/**
 * @fileoverview Хук загрузки списка пользователей
 * @description Загружает список пользователей проекта для навигации
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';

/**
 * Загружает список пользователей проекта
 * @param {number} projectId - Идентификатор проекта
 * @returns {{ users: UserBotData[], isLoading: boolean }}
 */
export function useUserList(projectId: number): { users: UserBotData[]; isLoading: boolean } {
  const { data: users = [], isLoading } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users`],
    select: (data) => {
      // Защита: если данные не массив, возвращаем пустой массив
      if (!Array.isArray(data)) {
        console.warn('useUserList: API returned non-array data:', data);
        return [];
      }
      return data;
    },
  });

  return { users, isLoading };
}
