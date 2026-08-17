/**
 * @fileoverview Запуск рассылки по явно выбранным ботам проекта
 * @module botIntegration/handlers/broadcasts/start-selected-tokens-broadcast
 */

import type { BotToken } from "@shared/schema";
import { resolveProjectTokenIds } from "./resolve-project-token-ids";
import { startBroadcastCampaign, type CampaignContent, type StartedCampaign } from "./start-campaign-broadcasts";
import {
  assertGroupsBelongToToken,
  resolveGroupIdsForToken,
} from "./validate-groups-by-token";

/** Результат запуска выбранных ботов */
export type SelectedTokensStartResult =
  | { kind: "error"; message: string }
  | { kind: "campaign"; started: StartedCampaign }
  | { kind: "single"; token: BotToken };

/**
 * Резолвит выбранных ботов: кампания при 2+, один токен при 1, ошибка иначе
 * @param content - Общее содержимое рассылки
 * @param tokenIds - Явно выбранные ID токенов
 * @param groupsByToken - Группы по токенам
 * @returns Кампания, одиночный токен или ошибка
 */
export async function startSelectedTokensBroadcast(
  content: CampaignContent,
  tokenIds: number[],
  groupsByToken: Map<number, string[]>,
): Promise<SelectedTokensStartResult> {
  const resolved = await resolveProjectTokenIds(content.projectId, tokenIds);
  if (resolved.error) return { kind: "error", message: resolved.error };

  for (const [tid] of groupsByToken) {
    if (!tokenIds.includes(tid)) {
      return { kind: "error", message: `groupsByTokenId содержит чужой токен ${tid}` };
    }
  }

  for (const token of resolved.tokens) {
    const gids = resolveGroupIdsForToken(token.id, groupsByToken, content.filters.groupIds);
    const err = await assertGroupsBelongToToken(content.projectId, token.id, gids);
    if (err) return { kind: "error", message: err };
  }

  if (resolved.tokens.length > 1) {
    const started = await startBroadcastCampaign(content, resolved.tokens);
    return { kind: "campaign", started };
  }

  return { kind: "single", token: resolved.tokens[0] };
}
