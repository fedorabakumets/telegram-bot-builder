/**
 * @fileoverview Хук загрузки списка пользователей
 * @description Загружает список пользователей проекта для навигации
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/**
 * Загружает список пользователей проекта
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @returns Список пользователей и состояние загрузки
 */
export function useUserList(
  projectId: number,
  selectedTokenId?: number | null
): { users: UserBotData[]; isLoading: boolean } {
  const requestUrl = buildUsersApiUrl(`/api/projects/${projectId}/users`, selectedTokenId);

  const { data: users = [], isLoading } = useQuery<UserBotData[]>({
    queryKey: [requestUrl, selectedTokenId],
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  return { users, isLoading };
}
