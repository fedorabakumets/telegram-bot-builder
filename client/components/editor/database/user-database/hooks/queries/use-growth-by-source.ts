/**
 * @fileoverview Хук для загрузки данных прироста пользователей по источникам трафика
 * @description Получает прирост через GET /api/projects/:id/users/growth-by-source с поддержкой гранулярности
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { getChartGranularityRefetchInterval } from './chart-granularity';
import { GrowthGranularity } from './use-growth';

/**
 * Точка данных прироста пользователей по источникам за один период
 */
export interface GrowthBySourcePoint {
  /** Дата/время в формате ISO */
  date: string;
  /** Количество новых пользователей по источникам: {telegram: 12, instagram: 8, ...} */
  sources: Record<string, number>;
}

/**
 * Параметры хука useGrowthBySource
 */
interface UseGrowthBySourceParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Гранулярность графика, по умолчанию "1d" (30 дней) */
  granularity?: GrowthGranularity;
}

/**
 * Хук для загрузки данных прироста пользователей по источникам трафика
 * @param params - Параметры хука
 * @returns Точки прироста по источникам и состояние загрузки
 */
export function useGrowthBySource(params: UseGrowthBySourceParams) {
  const { projectId, selectedTokenId, granularity = '1d' } = params;

  const baseUrl = `/api/projects/${projectId}/users/growth-by-source?granularity=${granularity}`;
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<GrowthBySourcePoint[]>({
    queryKey: ['users-growth-by-source', projectId, selectedTokenId, granularity],
    queryFn: async () => {
      const response = await fetch(requestUrl, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: getChartGranularityRefetchInterval(granularity),
    placeholderData: keepPreviousData,
  });

  const points = data ?? [];

  return {
    /** Массив точек прироста по источникам */
    points,
    /** Флаг загрузки данных */
    isLoading,
  };
}
