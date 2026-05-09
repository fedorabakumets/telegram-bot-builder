/**
 * @fileoverview Хук для загрузки данных прироста пользователей по источникам трафика
 * @description Получает прирост через GET /api/projects/:id/users/growth-by-source с поддержкой гранулярности
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
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
  /** Гранулярность графика: "1h" | "1d" | "7d" | "30d", по умолчанию "1d" */
  granularity?: GrowthGranularity;
}

/**
 * Интервал автоматического обновления в миллисекундах по гранулярности.
 * Для коротких периодов — чаще, для длинных — реже.
 * @param granularity - Гранулярность периода
 * @returns Интервал в мс или false если polling не нужен
 */
function getRefetchInterval(granularity: GrowthGranularity): number | false {
  switch (granularity) {
    case '1m':  return 30_000;   // каждые 30 сек — минутный график
    case '5m':  return 60_000;   // каждую минуту — 5-минутный график
    case '1h':  return 120_000;  // каждые 2 мин — часовой график
    case '1d':  return 300_000;  // каждые 5 мин — дневной график
    default:    return false;    // 7д, 30д — только по WS-событию
  }
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
    gcTime: 0,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: getRefetchInterval(granularity),
  });

  const points = data ?? [];

  return {
    /** Массив точек прироста по источникам */
    points,
    /** Флаг загрузки данных */
    isLoading,
  };
}
