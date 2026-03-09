/**
 * @fileoverview Хук для загрузки списка пользователей
 * @description Получает список всех пользователей проекта
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';

/**
 * Параметры хука useUsers
 */
interface UseUsersParams {
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Хук для загрузки пользователей
 * @param params - Параметры хука
 * @returns Список пользователей и состояние загрузки
 */
export function useUsers(params: UseUsersParams) {
  const { projectId } = params;

  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users`],
    staleTime: 0,
    gcTime: 0,
  });

  return { users, isUsersLoading: isLoading, refetchUsers: refetch };
}
