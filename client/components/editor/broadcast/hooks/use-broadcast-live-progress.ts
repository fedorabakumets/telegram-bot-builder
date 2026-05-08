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

/**
 * Хук подписки на WS-события прогресса рассылки.
 * Использует UserMessagesLiveProvider для получения событий broadcast-progress.
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

      // Приводим к плоской структуре BroadcastProgressEvent
      setProgressEvent({
        type: 'broadcast-progress',
        projectId: event.projectId,
        broadcastId: event.data.broadcastId,
        sentCount: event.data.sentCount,
        deliveredCount: event.data.deliveredCount,
        failedCount: event.data.failedCount,
        totalCount: event.data.totalCount,
        status: event.data.status,
      });
    });

    return unsubscribe;
  }, [liveContext, projectId, broadcastId]);

  return { progressEvent };
}
