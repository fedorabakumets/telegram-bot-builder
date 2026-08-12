/**
 * @fileoverview Пересчёт агрегатов кампании рассылки из дочерних рассылок
 * @module botIntegration/handlers/broadcasts/sync-campaign-aggregates
 */

import type { BroadcastCampaign } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import { deriveCampaignStatus, isTerminalCampaignStatus } from "./derive-campaign-status";

/**
 * Пересчитывает счётчики и статус кампании по её дочерним рассылкам.
 * Безопасна к параллельным вызовам из нескольких очередей: считает из БД, а не инкрементами.
 * @param campaignId - ID кампании (null/undefined — вызов игнорируется)
 * @returns Обновлённая кампания или undefined
 */
export async function syncCampaignAggregates(
  campaignId: number | null | undefined,
): Promise<BroadcastCampaign | undefined> {
  if (!campaignId) return undefined;

  try {
    const children = await storage.getBroadcastsByCampaignId(campaignId);
    if (children.length === 0) return undefined;

    const status = deriveCampaignStatus(children.map((child) => child.status));

    const totals = children.reduce(
      (acc, child) => ({
        totalCount: acc.totalCount + (child.totalCount ?? 0),
        sentCount: acc.sentCount + (child.sentCount ?? 0),
        deliveredCount: acc.deliveredCount + (child.deliveredCount ?? 0),
        failedCount: acc.failedCount + (child.failedCount ?? 0),
        blockedCount: acc.blockedCount + (child.blockedCount ?? 0),
        deletedCount: acc.deletedCount + (child.deletedCount ?? 0),
      }),
      {
        totalCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        blockedCount: 0,
        deletedCount: 0,
      },
    );

    const campaign = await storage.getBroadcastCampaignById(campaignId);
    if (!campaign) return undefined;

    return await storage.updateBroadcastCampaign(campaignId, {
      ...totals,
      status,
      // startedAt проставляем один раз при первом переходе в работу
      ...(campaign.startedAt ? {} : { startedAt: new Date() }),
      // finishedAt — только при переходе в терминальный статус
      ...(isTerminalCampaignStatus(status) && !campaign.finishedAt ? { finishedAt: new Date() } : {}),
    });
  } catch (error) {
    console.error(`[syncCampaignAggregates] Ошибка синхронизации кампании ${campaignId}:`, error);
    return undefined;
  }
}
