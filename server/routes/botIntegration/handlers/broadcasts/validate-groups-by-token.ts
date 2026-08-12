/**
 * @fileoverview Валидация groupsByTokenId: токены из запроса и принадлежность чатов
 * @module botIntegration/handlers/broadcasts/validate-groups-by-token
 */

import { storage } from "../../../../storages/storage";

/**
 * Нормализует map групп: ключи — числовые id токенов
 * @param raw - Сырой объект из тела запроса
 * @returns Map tokenId → groupIds
 */
export function normalizeGroupsByTokenId(
  raw: Record<string, string[]> | undefined,
): Map<number, string[]> {
  const map = new Map<number, string[]>();
  if (!raw) return map;
  for (const [key, ids] of Object.entries(raw)) {
    const tokenId = Number(key);
    if (!Number.isInteger(tokenId) || tokenId <= 0) continue;
    const cleaned = (ids ?? []).map(String).filter(Boolean);
    if (cleaned.length) map.set(tokenId, cleaned);
  }
  return map;
}

/**
 * Проверяет, что groupIds принадлежат токену (bot_groups или bot_messages)
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param groupIds - Telegram chat_id
 * @returns null если ок, иначе текст ошибки
 */
export async function assertGroupsBelongToToken(
  projectId: number,
  tokenId: number,
  groupIds: string[],
): Promise<string | null> {
  if (groupIds.length === 0) return null;
  const owned = new Set<string>();
  for (const g of await storage.getBotGroupsByProject(projectId, tokenId)) {
    if (g.groupId) owned.add(g.groupId);
  }
  for (const chat of await storage.listGroupChatsFromMessages(projectId, tokenId)) {
    owned.add(chat.groupId);
  }
  const foreign = groupIds.filter((id) => !owned.has(id));
  if (foreign.length > 0) {
    return `Группы не принадлежат боту ${tokenId}: ${foreign.slice(0, 5).join(", ")}`;
  }
  return null;
}

/**
 * Собирает filters.groupIds для одного токена из groupsByTokenId или общего groupIds
 * @param tokenId - ID токена
 * @param groupsByToken - Карта по токенам
 * @param fallbackGroupIds - Общий список (режим одного бота)
 * @returns groupIds для child-broadcast
 */
export function resolveGroupIdsForToken(
  tokenId: number,
  groupsByToken: Map<number, string[]>,
  fallbackGroupIds?: string[],
): string[] {
  if (groupsByToken.has(tokenId)) return groupsByToken.get(tokenId) ?? [];
  return fallbackGroupIds ?? [];
}
