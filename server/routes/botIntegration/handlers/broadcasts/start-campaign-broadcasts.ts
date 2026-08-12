/**
 * @fileoverview Создание кампании рассылки и параллельный запуск дочерних очередей по ботам
 * @module botIntegration/handlers/broadcasts/start-campaign-broadcasts
 */

import type { BotToken, BroadcastFilters } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import { runBroadcastQueue } from "./broadcastQueue";

/** Общее содержимое кампании, копируемое во все дочерние рассылки */
export interface CampaignContent {
  /** ID проекта */
  projectId: number;
  /** Название кампании */
  name: string;
  /** HTML-текст сообщения */
  messageText: string;
  /** URL / file_id медиафайлов */
  mediaUrls: string[];
  /** Инлайн-кнопки сообщения */
  buttons: unknown[];
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow: number;
  /** Фильтры аудитории */
  filters: BroadcastFilters;
}

/** Результат запуска кампании */
export interface StartedCampaign {
  /** ID созданной кампании */
  campaignId: number;
  /** ID созданных дочерних рассылок в порядке переданных токенов */
  broadcastIds: number[];
}

/**
 * Создаёт кампанию, дочернюю рассылку на каждого бота и запускает очереди параллельно.
 * Очереди работают независимо; агрегаты кампании пересчитываются из очередей.
 * @param content - Общее содержимое кампании
 * @param tokens - Токены ботов проекта, по которым идёт рассылка
 * @returns ID кампании и её дочерних рассылок
 */
export async function startBroadcastCampaign(
  content: CampaignContent,
  tokens: BotToken[],
): Promise<StartedCampaign> {
  const { projectId, name, messageText, mediaUrls, buttons, buttonsPerRow, filters } = content;

  const campaign = await storage.createBroadcastCampaign({
    projectId,
    name,
    messageText,
    mediaUrls,
    buttons: buttons as any[],
    buttonsPerRow,
    filters,
    tokenIds: tokens.map((token) => token.id),
    status: "running",
    startedAt: new Date(),
  });

  const broadcastIds: number[] = [];
  let totalCount = 0;

  for (const token of tokens) {
    const users = await storage.getUsersForBroadcast(projectId, token.id, filters);
    totalCount += users.length;

    const broadcast = await storage.createBroadcast({
      projectId,
      campaignId: campaign.id,
      tokenId: token.id,
      name,
      messageText,
      mediaUrls,
      buttons: buttons as any[],
      buttonsPerRow,
      filters,
      status: "running",
      totalCount: users.length,
      startedAt: new Date(),
    });

    broadcastIds.push(broadcast.id);
  }

  await storage.updateBroadcastCampaign(campaign.id, { totalCount });

  // Очереди стартуют параллельно — каждая шлёт свой прогресс с campaignId
  tokens.forEach((token, index) => {
    runBroadcastQueue(broadcastIds[index], token.token).catch((err) => {
      console.error(`[campaign] Ошибка очереди рассылки ${broadcastIds[index]}:`, err);
    });
  });

  return { campaignId: campaign.id, broadcastIds };
}
