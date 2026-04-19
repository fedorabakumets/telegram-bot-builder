/**
 * @fileoverview Хук для поиска пользователей
 * @description Выполняет поиск по пользователям по выбранному токену
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/**
 * Параметры хука useSearchUsers
 */
interface UseSearchUsersParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Поисковый запрос */
  searchQuery: string;
}

/**
 * Хук для поиска пользователей
 * @param params - Параметры хука
 * @returns Результаты поиска
 */
export function useSearchUsers(params: UseSearchUsersParams) {
  const { projectId, selectedTokenId, searchQuery } = params;
  const requestUrl = buildUsersApiUrl(
    `/api/projects/${projectId}/users/search`,
    selectedTokenId,
    { q: searchQuery }
  );

  const { data: searchResults = [] } = useQuery<UserBotData[]>({
    queryKey: [requestUrl, selectedTokenId, searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      return response.json();
    },
  });

  return { searchResults };
}
