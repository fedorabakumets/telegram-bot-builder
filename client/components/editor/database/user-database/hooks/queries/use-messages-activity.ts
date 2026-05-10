/**
 * @fileoverview Хук для загрузки данных активности сообщений с поддержкой гранулярности
 * @description Получает количество сообщений через GET /api/projects/:id/messages/activity.
 *              Поддерживает режим split — разбивку на входящие (от пользователей) и исходящие (от бота).
 */

import { useQuery } from '@tanstack/react-query';
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import { GrowthPoint } from './use-growth';

/** Доступные значения гранулярности для графика активности */
export type Granularity = '1m' | '5m' | '1h' | '1d' | '7d' | '30d';

/**
 * Точка активности с разбивкой по направлению
 */
export interface ActivitySplitPoint {
  /** Дата в ISO формате */
  date: string;
  /** Входящие сообщения (от пользователей) */
  incoming: number;
  /** Исходящие сообщения (от бота) */
  outgoing: number;
}

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
  /** Режим разбивки: true — вернуть входящие/исходящие отдельно */
  split?: boolean;
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
 * Интервал автоматического обновления в миллисекундах по гранулярности.
 * Для коротких периодов — чаще, для длинных — реже.
 * @param granularity - Гранулярность периода
 * @returns Интервал в мс или false если polling не нужен
 */
function getRefetchInterval(granularity: Granularity | undefined): number | false {
  switch (granularity) {
    case '1m':  return 30_000;   // каждые 30 сек — минутный график
    case '5m':  return 60_000;   // каждую минуту — 5-минутный график
    case '1h':  return 120_000;  // каждые 2 мин — часовой график
    case '1d':  return 300_000;  // каждые 5 мин — дневной график
    default:    return false;    // 7д, 30д — только по WS-событию
  }
}

/**
 * Строит URL запроса в зависимости от переданных параметров
 * @param projectId - Идентификатор проекта
 * @param granularity - Гранулярность (приоритет над period)
 * @param period - Период (обратная совместимость)
 * @param split - Режим разбивки на входящие/исходящие
 * @returns URL без токена
 */
function buildActivityUrl(
  projectId: number,
  granularity: Granularity | undefined,
  period: string,
  split: boolean,
): string {
  const splitParam = split ? '&split=true' : '';
  if (granularity) {
    return `/api/projects/${projectId}/messages/activity?granularity=${granularity}${splitParam}`;
  }
  return `/api/projects/${projectId}/messages/activity?period=${period}${splitParam}`;
}

/**
 * Хук для загрузки данных активности сообщений
 * @param params - Параметры хука
 * @returns Точки активности, недельное количество сообщений, текущая гранулярность и состояние загрузки
 */
export function useMessagesActivity(params: UseMessagesActivityParams) {
  const { projectId, selectedTokenId, granularity, period = '30d', split = false } = params;

  const baseUrl = buildActivityUrl(projectId, granularity, period, split);
  const requestUrl = buildUsersApiUrl(baseUrl, selectedTokenId);

  const { data, isLoading } = useQuery<GrowthPoint[] | ActivitySplitPoint[]>({
    queryKey: ['messages-activity', projectId, selectedTokenId, granularity ?? period, split],
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
    placeholderData: undefined,
  });

  if (split) {
    const splitPoints = (data ?? []) as ActivitySplitPoint[];
    /** Входящие как GrowthPoint для SparklineChart */
    const incomingPoints: GrowthPoint[] = splitPoints.map(p => ({ date: p.date, count: p.incoming }));
    /** Исходящие как GrowthPoint для SparklineChart */
    const outgoingPoints: GrowthPoint[] = splitPoints.map(p => ({ date: p.date, count: p.outgoing }));
    const weeklyIncoming = calcWeeklyMessages(incomingPoints);
    const weeklyOutgoing = calcWeeklyMessages(outgoingPoints);
    return {
      /** Точки входящих сообщений */
      points: incomingPoints,
      /** Точки исходящих сообщений */
      outgoingPoints,
      /** Сырые split-данные */
      splitPoints,
      /** Недельные входящие */
      weeklyMessages: weeklyIncoming,
      /** Недельные исходящие */
      weeklyOutgoing,
      granularity,
      isLoading,
    };
  }

  const points = (data ?? []) as GrowthPoint[];
  return {
    /** Массив точек активности сообщений */
    points,
    /** Точки исходящих (пусто в обычном режиме) */
    outgoingPoints: [] as GrowthPoint[],
    /** Сырые split-данные (пусто в обычном режиме) */
    splitPoints: [] as ActivitySplitPoint[],
    /** Суммарное количество сообщений за последние 7 дней */
    weeklyMessages: calcWeeklyMessages(points),
    /** Недельные исходящие (0 в обычном режиме) */
    weeklyOutgoing: 0,
    /** Текущая гранулярность (если задана) */
    granularity,
    /** Флаг загрузки данных */
    isLoading,
  };
}
