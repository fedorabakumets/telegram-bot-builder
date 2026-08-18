/**
 * @fileoverview После удаления дочерней рассылки обновляет кампанию или удаляет её
 * @module botIntegration/handlers/broadcasts/prune-campaign-after-child-delete
 */

import { storage } from "../../../../storages/storage";
import { planCampaignAfterChildDelete } from "./plan-campaign-after-child-delete";
import { syncCampaignAggregates } from "./sync-campaign-aggregates";

/**
 * Синхронизирует кампанию после удаления одной дочерней рассылки:
 * если ботов не осталось — удаляет кампанию, иначе обновляет tokenIds и агрегаты.
 *
 * @param campaignId - ID кампании или null для одиночной рассылки
 * @returns void
 */
export async function pruneCampaignAfterChildDelete(
  campaignId: number | null | undefined,
): Promise<void> {
  if (!campaignId) return;

  const children = await storage.getBroadcastsByCampaignId(campaignId);
  const plan = planCampaignAfterChildDelete(children);
  if (plan.action === 'delete') {
    await storage.deleteBroadcastCampaign(campaignId);
    return;
  }

  await storage.updateBroadcastCampaign(campaignId, { tokenIds: plan.tokenIds });
  await syncCampaignAggregates(campaignId);
}
