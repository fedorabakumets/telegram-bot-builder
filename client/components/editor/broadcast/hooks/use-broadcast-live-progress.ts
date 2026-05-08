/**
 * @fileoverview Хук подписки на WS-события прогресса рассылки
 * @module client/components/editor/broadcast/hooks/use-broadcast-live-progress
 */

import { useEffect, useState } from 'react';
import { useUserMessagesLiveContext } from '@/components/editor/database/user-database/contexts/user-messages-live-context';
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
      if ((msg as unknown as BroadcastProgressEvent).type !== 'broadcast-progress') return;
      const event = msg as unknown as BroadcastProgressEvent;
      if (event.projectId !== projectId) return;
      if (broadcastId && event.broadcastId !== broadcastId) return;
      setProgressEvent(event);
    });

    return unsubscribe;
  }, [liveContext, projectId, broadcastId]);

  return { progressEvent };
}
