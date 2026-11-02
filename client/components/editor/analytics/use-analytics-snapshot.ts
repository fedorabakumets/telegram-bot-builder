/** @fileoverview Один согласованный снимок аналитики и восстановление через общий WebSocket. */
import { useEffect, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
import { subscribeSharedTerminalWs, onSharedTerminalWsReconnect, getSharedTerminalWsState, getSharedAnalyticsBridgeState, subscribeSharedTerminalWsState } from '@/lib/shared-terminal-ws';
import { reportParams, type AnalyticsReportFilter } from './analytics-report-filter';

/**
 * Проверяет HTTP-ответ до чтения снимка или справочника.
 * @param url - Адрес серверного API.
 * @param options - Параметры запроса и отмены.
 * @returns Разобранный ответ либо понятная ошибка.
 */
export async function analyticsJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', ...options });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : typeof body?.error === 'string' ? body.error : 'Не удалось загрузить данные. Повторите запрос.');
  return body as T;
}
/**
 * Загружает снимок всех карточек; период и область входят в ключ запроса.
 * @param projectId - Открытый проект.
 * @param tokenId - Выбранный бот или весь проект.
 * @param filter - Общий диапазон и настройки отчёта.
 * @returns Запрос снимка и состояние живого обновления.
 */
export function useAnalyticsSnapshot(projectId: number, tokenId: number | null | undefined, filter: AnalyticsReportFilter) {
  const client = useQueryClient();
  const connection = useSyncExternalStore(subscribeSharedTerminalWsState, getSharedTerminalWsState, getSharedTerminalWsState);
  const bridgeConnected = useSyncExternalStore(subscribeSharedTerminalWsState, getSharedAnalyticsBridgeState, getSharedAnalyticsBridgeState);
  const serialized = JSON.stringify(filter);
  const query = useQuery<AnalyticsV2Snapshot>({
    queryKey: ['analytics-v2', projectId, tokenId ?? null, serialized],
    queryFn: ({ signal }) => analyticsJson(`/api/projects/${projectId}/analytics/v2/snapshot?${reportParams(filter, tokenId)}`, { signal }),
    enabled: projectId > 0, retry: 1, staleTime: 0, refetchOnWindowFocus: false,
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** Объединяет всплеск событий в одну загрузку активных отчётов. */
    const invalidate = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        void client.invalidateQueries({ predicate: item => ['analytics-v2', 'analytics-acquisition', 'bot-table-chart', 'chat-access-check'].includes(String(item.queryKey[0])) && item.queryKey[1] === projectId });
      }, 250);
    };
    const unsubscribe = subscribeSharedTerminalWs(raw => {
      if (!raw || typeof raw !== 'object') return;
      const event = raw as { type?: string; projectId?: number; tokenId?: number; data?: { connected?: boolean } };
      if (event.type === 'analytics-status') { if (event.data?.connected === true) invalidate(); return; }
      if (event.projectId !== projectId || (tokenId != null && event.tokenId != null && event.tokenId !== tokenId)) return;
      if (['analytics-changed', 'chat-access-check-progress', 'user-updated', 'group-updated'].includes(event.type ?? '')) invalidate();
    });
    const reconnect = onSharedTerminalWsReconnect(invalidate);
    /** При возвращении сверяет данные даже после потерянного уведомления. */
    const visible = () => { if (document.visibilityState === 'visible') invalidate(); };
    document.addEventListener('visibilitychange', visible);
    return () => { unsubscribe(); reconnect(); clearTimeout(timer); document.removeEventListener('visibilitychange', visible); };
  }, [client, projectId, tokenId]);
  useEffect(() => {
    const boundary = query.data?.next_recompute_at;
    if (!boundary || !Number.isFinite(Date.parse(boundary))) return;
    const timeout = setTimeout(() => { void query.refetch(); }, Math.min(2147483647, Math.max(1000, Date.parse(boundary) - Date.now())));
    return () => clearTimeout(timeout);
  }, [query.data?.next_recompute_at, query.dataUpdatedAt, serialized]);
  return { ...query, connection, bridgeConnected };
}
