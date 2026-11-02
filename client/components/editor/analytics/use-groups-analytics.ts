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
  /** Впервые сохранены за последние 7 дней. */
  addedLast7Days: number;
}

/**
 * Грузит группы проекта или выбранного бота, не смешивая ключи кэша.
 * @param projectId - Проект
 * @param tokenId - Выбранный бот
 * @param granularity - Период графика
 * @returns Сводка и точки графика
 */
export function useGroupsAnalytics(projectId: number, tokenId: number | null, granularity: ChartGranularity) {
  const enabled = !!projectId;
  /** Без выбранного бота сервер считает уникальные группы проекта. */
  const scope = tokenId == null ? '' : `&tokenId=${tokenId}`;
  const stats = useQuery<GroupsAnalyticsStats>({
    queryKey: ['groups-analytics-stats', projectId, tokenId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/groups/analytics/stats?${scope.slice(1)}`, { credentials: 'include' });
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
        `/api/projects/${projectId}/groups/analytics/growth?granularity=${granularity}${scope}`,
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
  return { stats: stats.data, points: growth.data ?? [] };
}
