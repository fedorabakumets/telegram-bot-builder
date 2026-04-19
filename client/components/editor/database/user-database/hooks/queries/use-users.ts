/**
 * @fileoverview Хук для загрузки списка пользователей
 * @description Получает список пользователей проекта с учётом выбранного токена
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/**
 * Параметры хука useUsers
 */
interface UseUsersParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Хук для загрузки пользователей
 * @param params - Параметры хука
 * @returns Список пользователей и состояние загрузки
 */
export function useUsers(params: UseUsersParams) {
  const { projectId, selectedTokenId } = params;
  const requestUrl = buildUsersApiUrl(`/api/projects/${projectId}/users`, selectedTokenId);

  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery<UserBotData[]>({
    queryKey: [requestUrl, selectedTokenId],
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
  });

  return { users, isUsersLoading: isLoading, refetchUsers: refetch };
}
