/**
 * @fileoverview Хук для поиска пользователей
 * @description Выполняет поиск пользователей по поисковому запросу
 */

import { useQuery } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';

/**
 * Параметры хука useSearchUsers
 */
interface UseSearchUsersParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Поисковый запрос */
  searchQuery: string;
}

/**
 * Хук для поиска пользователей
 * @param params - Параметры хука
 * @returns Результаты поиска
 */
export function useSearchUsers(params: UseSearchUsersParams) {
  const { projectId, searchQuery } = params;

  const { data: searchResults = [] } = useQuery<UserBotData[]>({
    queryKey: [`/api/projects/${projectId}/users/search`, searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      return response.json();
    },
  });

  return { searchResults };
}
