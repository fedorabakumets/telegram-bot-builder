/**
 * @fileoverview Хук агрегации live-прогресса большой рассылки по всем её ботам
 * @module client/components/editor/broadcast/hooks/use-campaign-live-progress
 */

import { useEffect, useState } from 'react';
import {
  useUserMessagesLiveContext,
  type BroadcastProgressLiveEvent,
} from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import type { BroadcastProgressEvent } from '../types';

/**
 * Суммарный прогресс большой рассылки по всем ботам
 */
export interface CampaignProgressTotals {
  /** Обработано сообщений */
  sentCount: number;
  /** Доставлено успешно */
  deliveredCount: number;
  /** Ошибок при отправке */
  failedCount: number;
  /** Всего получателей */
  totalCount: number;
  /** Есть ли хотя бы один бот, который ещё отправляет */
  isRunning: boolean;
}

/**
 * Результат хука useCampaignLiveProgress
 */
export interface UseCampaignLiveProgressResult {
  /** Суммарный прогресс по всем ботам или null, если событий ещё не было */
  totals: CampaignProgressTotals | null;
  /** Прогресс по каждой рассылке: ключ — идентификатор рассылки бота */
  byBroadcast: Map<number, BroadcastProgressEvent>;
}

/** Приоритет статусов — финальные статусы не перезаписываются более ранними */
const STATUS_PRIORITY: Record<string, number> = {
  running: 1,
  stopped: 2,
  done: 2,
};

/**
 * Глобальный кеш событий больших рассылок: campaignId → (broadcastId → событие).
 * Нужен, чтобы компонент увидел прогресс, даже если смонтирован позже событий.
 */
const campaignEventCache = new Map<number, Map<number, BroadcastProgressEvent>>();

/**
 * Складывает события всех ботов рассылки в суммарный прогресс
 * @param events - Карта событий по идентификатору рассылки бота
 * @returns Суммарный прогресс или null, если событий нет
 */
function aggregate(events: Map<number, BroadcastProgressEvent>): CampaignProgressTotals | null {
  if (events.size === 0) return null;
  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;
  let totalCount = 0;
  let isRunning = false;

  events.forEach((event) => {
    sentCount += event.sentCount;
    deliveredCount += event.deliveredCount;
    failedCount += event.failedCount;
    totalCount += event.totalCount;
    if (event.status === 'running') isRunning = true;
  });

  return { sentCount, deliveredCount, failedCount, totalCount, isRunning };
}

/**
 * Записывает событие в карту с защитой от регресса финального статуса
 * @param events - Карта событий по идентификатору рассылки бота
 * @param incoming - Новое событие прогресса
 * @returns Новая карта событий
 */
function withEvent(
  events: Map<number, BroadcastProgressEvent>,
  incoming: BroadcastProgressEvent,
): Map<number, BroadcastProgressEvent> {
  const previous = events.get(incoming.broadcastId);
  const prevPriority = STATUS_PRIORITY[previous?.status ?? ''] ?? 0;
  const incomingPriority = STATUS_PRIORITY[incoming.status] ?? 0;
  if (previous && incomingPriority < prevPriority) return events;
  const next = new Map(events);
  next.set(incoming.broadcastId, incoming);
  return next;
}

/**
 * Хук live-прогресса большой рассылки.
 * Слушает WS-события broadcast-progress проекта и суммирует прогресс всех ботов,
 * у которых событие относится к указанной большой рассылке.
 *
 * @param projectId - Идентификатор проекта
 * @param campaignId - Идентификатор большой рассылки (null — подписка не активна)
 * @returns Суммарный прогресс и прогресс по каждому боту
 */
export function useCampaignLiveProgress(
  projectId: number,
  campaignId?: number | null,
): UseCampaignLiveProgressResult {
  const [byBroadcast, setByBroadcast] = useState<Map<number, BroadcastProgressEvent>>(
    () => (campaignId ? campaignEventCache.get(campaignId) ?? new Map() : new Map()),
  );

  const liveContext = useUserMessagesLiveContext();

  useEffect(() => {
    setByBroadcast(campaignId ? campaignEventCache.get(campaignId) ?? new Map() : new Map());
  }, [campaignId]);

  useEffect(() => {
    if (!liveContext || !campaignId) return;

    const unsubscribe = liveContext.subscribe((msg) => {
      if (msg.type !== 'broadcast-progress') return;
      const event = msg as BroadcastProgressLiveEvent;
      if (event.projectId !== projectId) return;
      if (event.data.campaignId !== campaignId) return;

      const next: BroadcastProgressEvent = {
        type: 'broadcast-progress',
        projectId: event.projectId,
        broadcastId: event.data.broadcastId,
        campaignId,
        sentCount: event.data.sentCount,
        deliveredCount: event.data.deliveredCount,
        failedCount: event.data.failedCount,
        totalCount: event.data.totalCount,
        status: event.data.status,
      };

      const cached = campaignEventCache.get(campaignId) ?? new Map<number, BroadcastProgressEvent>();
      const updated = withEvent(cached, next);
      campaignEventCache.set(campaignId, updated);
      setByBroadcast(updated);
    });

    return unsubscribe;
  }, [liveContext, projectId, campaignId]);

  return { totals: aggregate(byBroadcast), byBroadcast };
}
