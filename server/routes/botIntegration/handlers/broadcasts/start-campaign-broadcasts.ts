/**
 * @fileoverview Создание кампании рассылки и параллельный запуск дочерних очередей по ботам
 * @module botIntegration/handlers/broadcasts/start-campaign-broadcasts
 */

import type { BotToken, BroadcastFilters } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import { runBroadcastQueue } from "./broadcastQueue";
import { resolveGroupIdsForToken } from "./validate-groups-by-token";

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
  /** Фильтры аудитории (без per-token groupIds — они подставляются на child) */
  filters: BroadcastFilters;
  /** Группы по токенам (Telegram chat_id) */
  groupsByToken?: Map<number, string[]>;
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
 * У каждого child в filters.groupIds — только группы его токена.
 * @param content - Общее содержимое кампании
 * @param tokens - Токены ботов проекта
 * @returns ID кампании и дочерних рассылок
 */
export async function startBroadcastCampaign(
  content: CampaignContent,
  tokens: BotToken[],
): Promise<StartedCampaign> {
  const {
    projectId,
    name,
    messageText,
    mediaUrls,
    buttons,
    buttonsPerRow,
    filters,
    groupsByToken = new Map(),
  } = content;

  const campaignFilters: BroadcastFilters = {
    ...filters,
    // На уровне кампании общий groupIds не храним — только per-token в дочерних
    groupIds: undefined,
  };

  const campaign = await storage.createBroadcastCampaign({
    projectId,
    name,
    messageText,
    mediaUrls,
    buttons: buttons as any[],
    buttonsPerRow,
    filters: campaignFilters,
    tokenIds: tokens.map((token) => token.id),
    status: "running",
    startedAt: new Date(),
  });

  const broadcastIds: number[] = [];
  let totalCount = 0;

  for (const token of tokens) {
    const users = await storage.getUsersForBroadcast(projectId, token.id, filters);
    totalCount += users.length;
    const groupIds = resolveGroupIdsForToken(token.id, groupsByToken, filters.groupIds);
    const childFilters: BroadcastFilters = {
      ...filters,
      ...(groupIds.length ? { groupIds } : { groupIds: undefined }),
    };

    const broadcast = await storage.createBroadcast({
      projectId,
      campaignId: campaign.id,
      tokenId: token.id,
      name,
      messageText,
      mediaUrls,
      buttons: buttons as any[],
      buttonsPerRow,
      filters: childFilters,
      status: "running",
      totalCount: users.length,
      startedAt: new Date(),
    });

    broadcastIds.push(broadcast.id);
  }

  await storage.updateBroadcastCampaign(campaign.id, { totalCount });

  tokens.forEach((token, index) => {
    runBroadcastQueue(broadcastIds[index], token.token).catch((err) => {
      console.error(`[campaign] Ошибка очереди рассылки ${broadcastIds[index]}:`, err);
    });
  });

  return { campaignId: campaign.id, broadcastIds };
}
