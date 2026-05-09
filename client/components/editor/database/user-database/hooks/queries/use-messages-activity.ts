/**
 * @fileoverview Хук для загрузки данных активности сообщений с поддержкой гранулярности
 * @description Получает количество сообщений через GET /api/projects/:id/messages/activity
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { GrowthPoint } from './use-growth';

/** Доступные значения гранулярности для графика активности */
export type Granularity = '1m' | '5m' | '1h' | '1d' | '7d' | '30d';

/**
 * Параметры хука useMessagesActivity
 */
export interface UseMessagesActivityParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Гранулярность графика (новый параметр) */
  granularity?: Granularity;
  /** Период: "7d" | "30d" | "90d" (старый параметр, для обратной совместимости) */
  period?: '7d' | '30d' | '90d';
}

/**
 * Вычисляет сумму сообщений за последние 7 дней из массива точек
 * @param points - Массив точек активности
 * @returns Суммарное количество сообщений за 7 дней
 */
function calcWeeklyMessages(points: GrowthPoint[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return points
    .filter(p => new Date(p.date) >= cutoff)
    .reduce((sum, p) => sum + p.count, 0);
}

/**
 * Строит URL запроса в зависимости от переданных параметров
 * @param projectId - Идентификатор проекта
 * @param granularity - Гранулярность (приоритет над period)
 * @param period - Период (обратная совместимость)
 * @returns URL без токена
 */
function buildActivityUrl(
  projectId: number,
  granularity: Granularity | undefined,
  period: string,
): string {
  if (granularity) {
    return `/api/projects/${projectId}/messages/activity?granularity=${granularity}`;
  }
  return `/api/projects/${projectId}/messages/activity?period=${period}`;
}

/**
 * Хук для загрузки данных активности сообщений
 * @param params - Параметры хука
 * @returns Точки активности, недельное количество сообщений, текущая гранулярность и состояние загрузки
 */
export function useMessagesActivity(params: UseMessagesActivityParams) {
  const { projectId, selectedTokenId, granularity, period = '30d' } = params;

  const baseUrl = buildActivityUrl(projectId, granularity, period);
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<GrowthPoint[]>({
    queryKey: ['messages-activity', projectId, selectedTokenId, granularity ?? period, requestUrl],
    queryFn: async () => {
      const response = await fetch(requestUrl, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    placeholderData: undefined,
  });

  const points = data ?? [];

  return {
    /** Массив точек активности сообщений */
    points,
    /** Суммарное количество сообщений за последние 7 дней */
    weeklyMessages: calcWeeklyMessages(points),
    /** Текущая гранулярность (если задана) */
    granularity,
    /** Флаг загрузки данных */
    isLoading,
  };
}
