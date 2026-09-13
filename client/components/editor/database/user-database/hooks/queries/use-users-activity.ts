/**
 * @fileoverview Хук загрузки активности пользователей (уникальные люди)
 * @module client/components/editor/database/user-database/hooks/queries/use-users-activity
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import {
  ChartGranularity,
  getChartGranularityRefetchInterval,
} from './chart-granularity';
import { GrowthPoint } from './use-growth';

/** Гранулярность графика активности пользователей */
export type UsersActivityGranularity = ChartGranularity;

/** Точка ответа сервера */
export interface UsersActivityPoint {
  /** ISO-дата слота */
  date: string;
  /** Все активные в слоте */
  total: number;
  /** Новички слота */
  newcomers: number;
  /** Вернувшиеся слота */
  returning: number;
}

/** Ответ GET /users/activity */
export interface UsersActivityResponse {
  /** Точки по слотам */
  points: UsersActivityPoint[];
  /** Уникальные активные за окно */
  activeInWindow: number;
  /** Новички за окно */
  newInWindow: number;
}

/**
 * Параметры хука useUsersActivity
 */
export interface UseUsersActivityParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Гранулярность графика */
  granularity?: UsersActivityGranularity;
}

/**
 * Загружает активность пользователей и готовит точки для графика
 * @param params - Проект, токен, гранулярность
 * @returns Точки, итоги окна и состояние загрузки
 */
export function useUsersActivity(params: UseUsersActivityParams) {
  const { projectId, selectedTokenId, granularity = '1d' } = params;

  const baseUrl = `/api/projects/${projectId}/users/activity?granularity=${granularity}`;
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<UsersActivityResponse>({
    queryKey: ['users-activity', projectId, selectedTokenId, granularity],
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

  const rawPoints = data?.points ?? [];
  /** Все активные как GrowthPoint */
  const points: GrowthPoint[] = rawPoints.map((p) => ({
    date: p.date,
    count: p.total,
  }));
  /** Новички */
  const newcomersPoints: GrowthPoint[] = rawPoints.map((p) => ({
    date: p.date,
    count: p.newcomers,
  }));
  /** Вернувшиеся */
  const returningPoints: GrowthPoint[] = rawPoints.map((p) => ({
    date: p.date,
    count: p.returning,
  }));

  return {
    points,
    newcomersPoints,
    returningPoints,
    activeInWindow: data?.activeInWindow ?? 0,
    newInWindow: data?.newInWindow ?? 0,
    granularity,
    isLoading,
  };
}
