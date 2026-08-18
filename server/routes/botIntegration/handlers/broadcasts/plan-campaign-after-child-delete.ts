/**
 * @fileoverview Решение: удалить кампанию или обновить список ботов после удаления дочерней рассылки
 * @module botIntegration/handlers/broadcasts/plan-campaign-after-child-delete
 */

/**
 * План обновления кампании после удаления одной дочерней рассылки
 */
export type CampaignPrunePlan =
  | { /** Кампанию нужно удалить — ботов не осталось */ action: 'delete' }
  | { /** Кампанию нужно обновить */ action: 'update'; /** Оставшиеся токены ботов */ tokenIds: number[] };

/**
 * Решает, удалить кампанию или обновить список ботов
 * @param remaining - Оставшиеся дочерние рассылки
 * @returns План удаления или обновления кампании
 */
export function planCampaignAfterChildDelete(
  remaining: Array<{ tokenId: number }>,
): CampaignPrunePlan {
  if (remaining.length === 0) return { action: 'delete' };
  return { action: 'update', tokenIds: remaining.map((child) => child.tokenId) };
}
