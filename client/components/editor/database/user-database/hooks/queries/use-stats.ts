/**
 * @fileoverview Хук для загрузки статистики пользователей
 * @description Получает статистику проекта с учётом выбранного токена
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { UserStats } from '../../types';

/**
 * Параметры хука useStats
 */
interface UseStatsParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Хук для загрузки статистики
 * @param params - Параметры хука
 * @returns Статистика и состояние загрузки
 */
export function useStats(params: UseStatsParams) {
  const { projectId, selectedTokenId } = params;
  const requestUrl = buildUsersApiUrl(`/api/projects/${projectId}/users/stats`, selectedTokenId);

  const {
    data: stats = {},
    isLoading,
    refetch,
  } = useQuery<UserStats>({
    queryKey: [requestUrl, selectedTokenId],
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  return { stats, isStatsLoading: isLoading, refetchStats: refetch };
}
