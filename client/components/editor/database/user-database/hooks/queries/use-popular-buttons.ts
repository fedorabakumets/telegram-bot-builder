/**
 * @fileoverview Хук для загрузки топ-10 самых популярных inline-кнопок
 * @description Получает данные через GET /api/projects/:id/users/popular-buttons с поддержкой гранулярности
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { getChartGranularityRefetchInterval } from './chart-granularity';
import { GrowthGranularity } from './use-growth';

/**
 * Элемент топа популярных кнопок
 */
export interface PopularButtonItem {
  /** Текст или callback_data кнопки */
  label: string;
  /** Количество нажатий */
  count: number;
}

/**
 * Параметры хука usePopularButtons
 */
interface UsePopularButtonsParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Гранулярность периода, по умолчанию "1d" (30 дней) */
  granularity?: GrowthGranularity;
}

/**
 * Хук для загрузки топ-10 самых популярных inline-кнопок
 * @param params - Параметры хука
 * @returns Массив элементов топа кнопок и состояние загрузки
 */
export function usePopularButtons(params: UsePopularButtonsParams) {
  const { projectId, selectedTokenId, granularity = '1d' } = params;

  const baseUrl = `/api/projects/${projectId}/users/popular-buttons?granularity=${granularity}`;
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<PopularButtonItem[]>({
    queryKey: ['popular-buttons', projectId, selectedTokenId, granularity],
    queryFn: async () => {
      const response = await fetch(requestUrl, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      return (raw ?? []).map((b: any) => ({ label: b.label, count: Number(b.count) }));
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

  return {
    /** Массив элементов топа популярных кнопок */
    items: data ?? [],
    /** Флаг загрузки данных */
    isLoading,
  };
}
