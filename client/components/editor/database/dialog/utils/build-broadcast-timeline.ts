/**
 * @fileoverview Сборка ленты рассылок: большие рассылки и одиночные в одном списке
 * @module editor/database/dialog/utils/build-broadcast-timeline
 */

import type { Broadcast, BroadcastCampaign } from '@shared/schema';

/**
 * Элемент ленты рассылок — либо большая рассылка по нескольким ботам,
 * либо одиночная рассылка одного бота
 */
export type BroadcastTimelineItem =
  | {
    /** Вид элемента: большая рассылка */
    kind: 'campaign';
    /** Ключ для React-списка */
    key: string;
    /** Дата создания для сортировки */
    createdAt: number;
    /** Данные большой рассылки */
    campaign: BroadcastCampaign;
  }
  | {
    /** Вид элемента: одиночная рассылка */
    kind: 'broadcast';
    /** Ключ для React-списка */
    key: string;
    /** Дата создания для сортировки */
    createdAt: number;
    /** Данные рассылки */
    broadcast: Broadcast;
  };

/**
 * Переводит дату в число для сортировки
 * @param value - Дата создания или null
 * @returns Метка времени в миллисекундах
 */
function toTime(value: Date | string | null | undefined): number {
  if (!value) return 0;
  return new Date(value).getTime();
}

/**
 * Собирает ленту рассылок: большие рассылки как один элемент,
 * рассылки внутри них скрываются из плоского списка.
 *
 * @param campaigns - Большие рассылки проекта
 * @param broadcasts - Все рассылки проекта (включая входящие в большие)
 * @returns Лента, отсортированная от новых к старым
 */
export function buildBroadcastTimeline(
  campaigns: BroadcastCampaign[],
  broadcasts: Broadcast[],
): BroadcastTimelineItem[] {
  const items: BroadcastTimelineItem[] = campaigns.map((campaign) => ({
    kind: 'campaign',
    key: `campaign-${campaign.id}`,
    createdAt: toTime(campaign.createdAt),
    campaign,
  }));

  for (const broadcast of broadcasts) {
    if (broadcast.campaignId != null) continue;
    items.push({
      kind: 'broadcast',
      key: `broadcast-${broadcast.id}`,
      createdAt: toTime(broadcast.createdAt),
      broadcast,
    });
  }

  return items.sort((a, b) => b.createdAt - a.createdAt);
}
