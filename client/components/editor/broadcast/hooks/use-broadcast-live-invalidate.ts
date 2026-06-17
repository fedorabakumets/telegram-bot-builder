/**
 * @fileoverview Хук real-time обновления кэша рассылок при WS-событиях broadcast-progress
 * @module client/components/editor/broadcast/hooks/use-broadcast-live-invalidate
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUserMessagesLiveContext,
  type BroadcastProgressLiveEvent,
  type LiveEvent,
} from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import type { Broadcast } from '../types';

/**
 * Ответ сервера на GET /api/projects/:projectId/broadcasts
 */
interface BroadcastsResponse {
  /** Список рассылок на текущей странице */
  broadcasts: Broadcast[];
  /** Общее количество рассылок */
  total: number;
  /** Текущая страница */
  page: number;
  /** Размер страницы */
  limit: number;
}

/**
 * Параметры хука useBroadcastLiveInvalidate
 */
interface UseBroadcastLiveInvalidateParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
}

/**
 * Проверяет, относится ли query key к списку рассылок проекта
 * @param queryKey - Ключ запроса React Query
 * @param projectId - Идентификатор проекта
 * @returns true если ключ соответствует списку рассылок
 */
function isBroadcastsListKey(queryKey: readonly unknown[], projectId: number): boolean {
  const first = queryKey[0];
  return typeof first === 'string' && first.startsWith(`/api/projects/${projectId}/broadcasts?`);
}

/**
 * Формирует URL-ключ детального запроса рассылки
 * @param projectId - Идентификатор проекта
 * @param broadcastId - Идентификатор рассылки
 * @returns URL для query key
 */
function buildDetailKey(projectId: number, broadcastId: number): string {
  return `/api/projects/${projectId}/broadcasts/${broadcastId}`;
}

/**
 * Хук real-time обновления кэша рассылок через WS-события broadcast-progress.
 *
 * При каждом событии:
 *   - optimistic setQueryData для списка рассылок (useBroadcasts)
 *   - optimistic setQueryData для деталей рассылки (useBroadcastDetail)
 *
 * При росте failedCount — invalidateQueries деталей с debounce ~1.5с (обновление ошибок).
 * При status done/stopped — полная инвалидация списка и деталей.
 *
 * @param params - Параметры хука
 * @returns void
 */
export function useBroadcastLiveInvalidate({
  projectId,
}: UseBroadcastLiveInvalidateParams): void {
  const queryClient = useQueryClient();
  const liveContext = useUserMessagesLiveContext();
  const detailInvalidateTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const lastFailedCounts = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!liveContext) return;

    /**
     * Планирует debounced-инвалидацию деталей рассылки при росте failedCount
     * @param broadcastId - Идентификатор рассылки
     */
    const scheduleDetailInvalidate = (broadcastId: number): void => {
      const existing = detailInvalidateTimers.current.get(broadcastId);
      if (existing) clearTimeout(existing);
      detailInvalidateTimers.current.set(
        broadcastId,
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [buildDetailKey(projectId, broadcastId)] });
          detailInvalidateTimers.current.delete(broadcastId);
        }, 1500),
      );
    };

    const unsubscribe = liveContext.subscribe((event: LiveEvent) => {
      if (event.type !== 'broadcast-progress') return;
      const msg = event as BroadcastProgressLiveEvent;
      if (msg.projectId !== projectId) return;

      const { broadcastId, sentCount, deliveredCount, failedCount, totalCount, status } = msg.data;

      queryClient.setQueriesData<BroadcastsResponse>(
        { predicate: (query) => isBroadcastsListKey(query.queryKey, projectId) },
        (old) => {
          if (!old) return old;
          const idx = old.broadcasts.findIndex((b) => b.id === broadcastId);
          if (idx === -1) return old;
          const broadcasts = [...old.broadcasts];
          broadcasts[idx] = {
            ...broadcasts[idx],
            status,
            sentCount,
            deliveredCount,
            failedCount,
            totalCount,
          };
          return { ...old, broadcasts };
        },
      );

      const detailKey = [buildDetailKey(projectId, broadcastId)];
      queryClient.setQueryData<{ broadcast: Broadcast; results: unknown[] }>(
        detailKey,
        (old) => {
          if (!old?.broadcast) return old;
          return {
            ...old,
            broadcast: {
              ...old.broadcast,
              status,
              sentCount,
              deliveredCount,
              failedCount,
              totalCount,
            },
          };
        },
      );

      const prevFailed = lastFailedCounts.current.get(broadcastId) ?? 0;
      if (failedCount > prevFailed) {
        lastFailedCounts.current.set(broadcastId, failedCount);
        scheduleDetailInvalidate(broadcastId);
      }

      if (status === 'done' || status === 'stopped') {
        queryClient.invalidateQueries({
          predicate: (query) => isBroadcastsListKey(query.queryKey, projectId),
        });
        queryClient.invalidateQueries({ queryKey: detailKey });
        lastFailedCounts.current.delete(broadcastId);
      }
    });

    return () => {
      unsubscribe();
      detailInvalidateTimers.current.forEach((timer) => clearTimeout(timer));
      detailInvalidateTimers.current.clear();
    };
  }, [projectId, queryClient, liveContext]);
}
