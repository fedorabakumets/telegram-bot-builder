/**
 * @fileoverview Хук для загрузки данных прироста пользователей
 * @description Получает ежедневный прирост через GET /api/projects/:id/users/growth
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/**
 * Точка данных прироста пользователей за один день
 */
export interface GrowthPoint {
  /** Дата в формате "YYYY-MM-DD" */
  date: string;
  /** Количество новых пользователей за этот день */
  count: number;
}

/**
 * Параметры хука useGrowth
 */
interface UseGrowthParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Период: "7d" | "30d" | "90d", по умолчанию "30d" */
  period?: '7d' | '30d' | '90d';
}

/**
 * Вычисляет сумму прироста за последние 7 дней из массива точек
 * @param points - Массив точек прироста
 * @returns Суммарный прирост за 7 дней
 */
function calcWeeklyGrowth(points: GrowthPoint[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return points
    .filter(p => new Date(p.date) >= cutoff)
    .reduce((sum, p) => sum + p.count, 0);
}

/**
 * Хук для загрузки данных прироста пользователей по дням
 * @param params - Параметры хука
 * @returns Точки прироста, недельный прирост и состояние загрузки
 */
export function useGrowth(params: UseGrowthParams) {
  const { projectId, selectedTokenId, period = '30d' } = params;

  const baseUrl = `/api/projects/${projectId}/users/growth?period=${period}`;
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<GrowthPoint[]>({
    queryKey: [requestUrl, selectedTokenId, period],
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
    gcTime: 0,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const points = data ?? [];

  return {
    /** Массив точек прироста по дням */
    points,
    /** Суммарный прирост за последние 7 дней */
    weeklyGrowth: calcWeeklyGrowth(points),
    /** Флаг загрузки данных */
    isLoading,
  };
}
