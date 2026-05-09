/**
 * @fileoverview Хук для загрузки данных прироста пользователей
 * @description Получает прирост через GET /api/projects/:id/users/growth с поддержкой гранулярности
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';

/** Доступные значения гранулярности для графика прироста пользователей */
export type GrowthGranularity = '1m' | '5m' | '1h' | '1d' | '7d' | '30d';

/**
 * Точка данных прироста пользователей за один период
 */
export interface GrowthPoint {
  /** Дата/время в формате ISO */
  date: string;
  /** Количество новых пользователей за этот период */
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
  /** Гранулярность графика: "1h" | "1d" | "7d" | "30d", по умолчанию "1d" */
  granularity?: GrowthGranularity;
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
 * Хук для загрузки данных прироста пользователей
 * @param params - Параметры хука
 * @returns Точки прироста, недельный прирост и состояние загрузки
 */
export function useGrowth(params: UseGrowthParams) {
  const { projectId, selectedTokenId, granularity = '1d' } = params;

  const baseUrl = `/api/projects/${projectId}/users/growth?granularity=${granularity}`;
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<GrowthPoint[]>({
    queryKey: ['users-growth', projectId, selectedTokenId, granularity],
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
    /** Массив точек прироста */
    points,
    /** Суммарный прирост за последние 7 дней */
    weeklyGrowth: calcWeeklyGrowth(points),
    /** Флаг загрузки данных */
    isLoading,
  };
}
