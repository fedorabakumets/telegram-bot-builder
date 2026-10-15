/**
 * @fileoverview Загрузка сводки и графика групп выбранного бота.
 * @module client/components/editor/analytics/use-groups-analytics
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ChartGranularity,
  getChartGranularityRefetchInterval,
} from '@/components/editor/database/user-database/hooks/queries/chart-granularity';
import type { GrowthPoint } from '@/components/editor/database/user-database/hooks/queries/use-growth';

/** Счётчики карточки групп. */
export interface GroupsAnalyticsStats {
  /** Всего групп. */
  totalGroups: number;
  /** Бот в чате. */
  availableGroups: number;
  /** Бота исключили. */
  kickedGroups: number;
}

/**
 * Считает, сколько групп впервые сохранилось за последние 7 дней.
 * @param points - Точки графика
 * @returns Сумма
 */
function weeklyAdded(points: GrowthPoint[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return points.filter((point) => new Date(point.date) >= cutoff).reduce((sum, point) => sum + point.count, 0);
}

/**
 * Грузит числа и ряд групп. Без бота запросы не идут.
 * @param projectId - Проект
 * @param tokenId - Выбранный бот
 * @param granularity - Период графика
 * @returns Сводка, точки и прирост за неделю
 */
export function useGroupsAnalytics(projectId: number, tokenId: number | null, granularity: ChartGranularity) {
  const enabled = !!projectId && !!tokenId;
  const stats = useQuery<GroupsAnalyticsStats>({
    queryKey: ['groups-analytics-stats', projectId, tokenId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/groups/analytics/stats?tokenId=${tokenId}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled,
    staleTime: 0,
    retry: false,
  });
  const growth = useQuery<GrowthPoint[]>({
    queryKey: ['groups-analytics-growth', projectId, tokenId, granularity],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/groups/analytics/growth?tokenId=${tokenId}&granularity=${granularity}`,
        { credentials: 'include' },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    enabled,
    staleTime: 0,
    retry: false,
    placeholderData: keepPreviousData,
    refetchInterval: getChartGranularityRefetchInterval(granularity),
  });
  const points = growth.data ?? [];
  return {
    stats: stats.data,
    points,
    weeklyAdded: weeklyAdded(points),
  };
}
