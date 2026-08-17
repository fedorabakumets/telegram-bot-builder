/**
 * @fileoverview Обновление кэша больших рассылок при WS-событиях прогресса
 * @module client/components/editor/broadcast/hooks/invalidate-campaign-cache
 */

import type { QueryClient } from '@tanstack/react-query';
import { buildCampaignsKey } from './use-broadcast-campaigns';
import { buildCampaignDetailKey, type BroadcastCampaignDetailResponse } from './use-broadcast-campaign-detail';

/**
 * Прогресс одной рассылки бота внутри большой рассылки
 */
export interface CampaignChildProgress {
  /** Идентификатор рассылки бота */
  broadcastId: number;
  /** Обработано сообщений */
  sentCount: number;
  /** Доставлено успешно */
  deliveredCount: number;
  /** Ошибок при отправке (прочие) */
  failedCount: number;
  /** Заблокировали бота */
  blockedCount: number;
  /** Аккаунт удалён */
  deletedCount: number;
  /** Всего получателей */
  totalCount: number;
  /** Текущий статус рассылки бота */
  status: 'running' | 'stopped' | 'done' | 'failed';
}

/**
 * Обновляет кэш деталей большой рассылки счётчиками пришедшего события
 * и инвалидирует список при завершении отправки у бота.
 *
 * @param queryClient - Клиент React Query
 * @param projectId - Идентификатор проекта
 * @param campaignId - Идентификатор большой рассылки
 * @param progress - Прогресс рассылки одного бота
 * @returns void
 */
export function applyCampaignProgress(
  queryClient: QueryClient,
  projectId: number,
  campaignId: number,
  progress: CampaignChildProgress,
): void {
  const detailKey = [buildCampaignDetailKey(projectId, campaignId)];

  queryClient.setQueryData<BroadcastCampaignDetailResponse>(detailKey, (old) => {
    if (!old?.campaign) return old;
    const index = old.broadcasts.findIndex((item) => item.id === progress.broadcastId);
    if (index === -1) return old;

    const broadcasts = [...old.broadcasts];
    broadcasts[index] = {
      ...broadcasts[index],
      status: progress.status,
      sentCount: progress.sentCount,
      deliveredCount: progress.deliveredCount,
      failedCount: progress.failedCount,
      blockedCount: progress.blockedCount,
      deletedCount: progress.deletedCount,
      totalCount: progress.totalCount,
    };

    // Агрегаты кампании пересчитываем из актуальных дочерних счётчиков
    const campaign = {
      ...old.campaign,
      sentCount: broadcasts.reduce((sum, item) => sum + (item.sentCount ?? 0), 0),
      deliveredCount: broadcasts.reduce((sum, item) => sum + (item.deliveredCount ?? 0), 0),
      failedCount: broadcasts.reduce((sum, item) => sum + (item.failedCount ?? 0), 0),
      blockedCount: broadcasts.reduce((sum, item) => sum + (item.blockedCount ?? 0), 0),
      deletedCount: broadcasts.reduce((sum, item) => sum + (item.deletedCount ?? 0), 0),
      totalCount: broadcasts.reduce((sum, item) => sum + (item.totalCount ?? 0), 0),
    };

    return { campaign, broadcasts };
  });

  if (progress.status === 'done' || progress.status === 'stopped' || progress.status === 'failed') {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: [buildCampaignsKey(projectId)] });
  }
}
