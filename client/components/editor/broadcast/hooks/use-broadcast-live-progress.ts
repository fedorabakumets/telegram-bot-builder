/**
 * @fileoverview Хук подписки на WS-события прогресса рассылки с кешем последних событий
 * @module client/components/editor/broadcast/hooks/use-broadcast-live-progress
 */

import { useEffect, useState } from 'react';
import { useUserMessagesLiveContext, type BroadcastProgressLiveEvent } from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import type { BroadcastProgressEvent } from '../types';

/**
 * Результат хука useBroadcastLiveProgress
 */
export interface UseBroadcastLiveProgressResult {
  /** Последнее событие прогресса рассылки или null */
  progressEvent: BroadcastProgressEvent | null;
}

/** Приоритет статусов — финальные статусы не перезаписываются более ранними */
const STATUS_PRIORITY: Record<string, number> = {
  running: 1,
  stopped: 2,
  done: 2,
};

/**
 * Глобальный кеш последних WS-событий по broadcastId.
 * Позволяет компонентам получить последнее событие даже если они смонтированы позже его прихода.
 */
const broadcastEventCache = new Map<number, BroadcastProgressEvent>();

/**
 * Обновляет кеш с учётом приоритета статусов — финальный статус не перезаписывается.
 * @param incoming - Новое событие
 */
function updateCache(incoming: BroadcastProgressEvent): void {
  const cached = broadcastEventCache.get(incoming.broadcastId);
  const prevPriority = STATUS_PRIORITY[cached?.status ?? ''] ?? 0;
  const incomingPriority = STATUS_PRIORITY[incoming.status] ?? 0;
  if (incomingPriority >= prevPriority) {
    broadcastEventCache.set(incoming.broadcastId, incoming);
  }
}

/**
 * Хук подписки на WS-события прогресса рассылки.
 * Использует UserMessagesLiveProvider для получения событий broadcast-progress.
 * Кеширует события глобально — компонент получает последнее событие даже при позднем монтировании.
 * Защищает от регресса статуса: финальный статус (done/stopped) не перезаписывается.
 *
 * @param projectId - Идентификатор проекта
 * @param broadcastId - Идентификатор рассылки (опционально, для фильтрации)
 * @returns Последнее событие прогресса
 */
export function useBroadcastLiveProgress(
  projectId: number,
  broadcastId?: number | null,
): UseBroadcastLiveProgressResult {
  // Инициализируем из кеша — если событие пришло до монтирования компонента
  const [progressEvent, setProgressEvent] = useState<BroadcastProgressEvent | null>(() => {
    if (!broadcastId) return null;
    return broadcastEventCache.get(broadcastId) ?? null;
  });

  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!liveContext) return;

    const unsubscribe = liveContext.subscribe((msg) => {
      // Фильтруем только события broadcast-progress
      if (msg.type !== 'broadcast-progress') return;
      const event = msg as BroadcastProgressLiveEvent;
      if (event.projectId !== projectId) return;
      if (broadcastId && event.data.broadcastId !== broadcastId) return;

      const next: BroadcastProgressEvent = {
        type: 'broadcast-progress',
        projectId: event.projectId,
        broadcastId: event.data.broadcastId,
        sentCount: event.data.sentCount,
        deliveredCount: event.data.deliveredCount,
        failedCount: event.data.failedCount,
        totalCount: event.data.totalCount,
        status: event.data.status,
      };

      // Обновляем глобальный кеш
      updateCache(next);

      setProgressEvent((prev) => {
        // Не перезаписываем финальный статус более ранним (защита от race condition)
        const prevPriority = STATUS_PRIORITY[prev?.status ?? ''] ?? 0;
        const incomingPriority = STATUS_PRIORITY[next.status] ?? 0;
        if (incomingPriority < prevPriority) return prev;
        return next;
      });
    });

    return unsubscribe;
  }, [liveContext, projectId, broadcastId]);

  return { progressEvent };
}
