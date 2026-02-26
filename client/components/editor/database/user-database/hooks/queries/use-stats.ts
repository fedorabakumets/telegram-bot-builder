/**
 * @fileoverview Хук для загрузки статистики пользователей
 * @description Получает агрегированную статистику по пользователям проекта
 */

import { useQuery } from '@tanstack/react-query';
import { UserStats } from '../../types';

/**
 * Параметры хука useStats
 */
interface UseStatsParams {
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Хук для загрузки статистики
 * @param params - Параметры хука
 * @returns Статистика и состояние загрузки
 */
export function useStats(params: UseStatsParams) {
  const { projectId } = params;

  const {
    data: stats = {},
    isLoading,
    refetch,
  } = useQuery<UserStats>({
    queryKey: [`/api/projects/${projectId}/users/stats`],
    staleTime: 0,
    gcTime: 0,
  });

  return { stats, isStatsLoading: isLoading, refetchStats: refetch };
}
