/**
 * @fileoverview Загрузка сохранённых логов за выбранный период отдельно от живого потока.
 */
import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotLog } from '@shared/schema';
import type { TerminalLine } from './terminalTypes';
import { botLogToTerminalLine } from './bot-log-utils';
import { resolveLogPeriodRange, type LogPeriod, type LogPeriodRange } from './terminal-log-period';

/** Число строк на одну страницу сохранённых логов. */
const PAGE_SIZE = 500;

/**
 * Управляет диапазоном, страницами истории и возвратом к живому потоку.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор бота
 * @param liveLines - Строки текущего запуска
 * @returns Состояние выбора периода и загрузки истории
 */
export function useTerminalPeriod(projectId: number | undefined, tokenId: number | undefined, liveLines: TerminalLine[]) {
  const [period, setPeriod] = useState<LogPeriod>('live');
  const [range, setRange] = useState<LogPeriodRange | null>(null);
  const query = useInfiniteQuery({
    queryKey: ['terminal-period-logs', projectId, tokenId, range?.from, range?.to],
    enabled: !!projectId && !!tokenId && !!range,
    initialPageParam: null as number | null,
    /** Загружает страницу строго выбранного диапазона и токена. */
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ from: range!.from, to: range!.to, limit: String(PAGE_SIZE) });
      if (pageParam !== null) params.set('beforeId', String(pageParam));
      return apiRequest('GET', `/api/projects/${projectId}/tokens/${tokenId}/logs?${params}`) as Promise<BotLog[]>;
    },
    /** Продолжает выборку по устойчивому курсору идентификатора. */
    getNextPageParam: (page: BotLog[]) => page.length === PAGE_SIZE ? Math.min(...page.map(log => log.id)) : undefined,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  const historyLines = useMemo(() => {
    const unique = new Map((query.data?.pages.flat() ?? []).map(log => [log.id, log]));
    return Array.from(unique.values()).map(botLogToTerminalLine)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime() || Number(a.id) - Number(b.id));
  }, [query.data]);

  /**
   * Выбирает стандартный период и фиксирует границы на момент выбора.
   * @param value - Период просмотра
   */
  function selectPeriod(value: LogPeriod) {
    setPeriod(value);
    setRange(resolveLogPeriodRange(value));
  }
  /**
   * Применяет проверенный произвольный диапазон.
   * @param value - Абсолютные границы
   */
  function selectCustom(value: LogPeriodRange) { setPeriod('custom'); setRange(value); }
  /** Обновляет историю; относительные периоды пересчитываются от текущего момента. */
  function refresh() {
    if (period === 'custom') void query.refetch();
    else selectPeriod(period);
  }
  return {
    period, range, selectPeriod, selectCustom, refresh,
    lines: range ? historyLines : liveLines,
    showDate: !!range && new Date(range.from).toDateString() !== new Date(new Date(range.to).getTime() - 1).toDateString(),
    isLoading: !!range && query.isPending,
    error: range ? query.error : null,
    hasMore: !!range && query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => { void query.fetchNextPage(); },
  };
}
