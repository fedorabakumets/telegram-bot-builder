/**
 * @fileoverview Хук подписки на WS-события прогресса рассылки
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
 * Хук подписки на WS-события прогресса рассылки.
 * Использует UserMessagesLiveProvider для получения событий broadcast-progress.
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
  const [progressEvent, setProgressEvent] = useState<BroadcastProgressEvent | null>(null);
  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    if (!liveContext) return;

    const unsubscribe = liveContext.subscribe((msg) => {
      // Фильтруем только события broadcast-progress
      if (msg.type !== 'broadcast-progress') return;
      const event = msg as BroadcastProgressLiveEvent;
      if (event.projectId !== projectId) return;
      if (broadcastId && event.data.broadcastId !== broadcastId) return;

      const incoming = event.data.status;

      setProgressEvent((prev) => {
        // Не перезаписываем финальный статус более ранним (защита от race condition)
        const prevPriority = STATUS_PRIORITY[prev?.status ?? ''] ?? 0;
        const incomingPriority = STATUS_PRIORITY[incoming] ?? 0;
        if (incomingPriority < prevPriority) return prev;

        return {
          type: 'broadcast-progress',
          projectId: event.projectId,
          broadcastId: event.data.broadcastId,
          sentCount: event.data.sentCount,
          deliveredCount: event.data.deliveredCount,
          failedCount: event.data.failedCount,
          totalCount: event.data.totalCount,
          status: incoming,
        };
      });
    });

    return unsubscribe;
  }, [liveContext, projectId, broadcastId]);

  return { progressEvent };
}
