/**
 * @fileoverview Хук для загрузки топ-10 самых популярных inline-кнопок
 * @description Получает данные через GET /api/projects/:id/users/popular-buttons с поддержкой гранулярности
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
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
  /** Гранулярность периода: "1m" | "5m" | "1h" | "1d" | "7d" | "30d", по умолчанию "1d" */
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
    refetchInterval: getRefetchInterval(granularity),
    placeholderData: keepPreviousData,
  });

  return {
    /** Массив элементов топа популярных кнопок */
    items: data ?? [],
    /** Флаг загрузки данных */
    isLoading,
  };
}
