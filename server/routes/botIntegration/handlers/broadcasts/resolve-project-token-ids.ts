/**
 * @fileoverview Резолв списка токенов ботов проекта для «большой рассылки»
 * с проверкой принадлежности каждого токена проекту
 * @module botIntegration/handlers/broadcasts/resolve-project-token-ids
 */

import type { BotToken } from "@shared/schema";
import { storage } from "../../../../storages/storage";

/** Результат резолва списка токенов проекта */
export interface ResolvedProjectTokens {
  /** Найденные токены проекта (пусто при ошибке) */
  tokens: BotToken[];
  /** Текст ошибки для ответа 400, если резолв не удался */
  error?: string;
}

/**
 * Возвращает токены проекта для рассылки.
 * Приоритет: явный tokenIds → одиночный tokenId → все токены проекта («все боты»).
 * Любой токен из tokenIds, не принадлежащий проекту, приводит к ошибке.
 * @param projectId - ID проекта
 * @param requestedTokenIds - Явно выбранные ID токенов (опционально)
 * @param fallbackTokenId - Одиночный tokenId из query/body (обратная совместимость)
 * @returns Список токенов проекта либо описание ошибки
 */
export async function resolveProjectTokenIds(
  projectId: number,
  requestedTokenIds?: number[],
  fallbackTokenId?: number | null,
): Promise<ResolvedProjectTokens> {
  const projectTokens = await storage.getBotTokensByProject(projectId);

  if (projectTokens.length === 0) {
    return { tokens: [], error: "Токен бота не найден для этого проекта" };
  }

  if (requestedTokenIds && requestedTokenIds.length > 0) {
    return pickRequestedTokens(projectTokens, requestedTokenIds);
  }

  if (fallbackTokenId) {
    const single = projectTokens.find((token) => token.id === fallbackTokenId);
    if (!single) {
      return { tokens: [], error: `Токен ${fallbackTokenId} не принадлежит этому проекту` };
    }
    return { tokens: [single] };
  }

  // Ни tokenIds, ни tokenId не переданы — рассылка по всем ботам проекта
  return { tokens: projectTokens };
}

/**
 * Отбирает запрошенные токены из токенов проекта, сохраняя порядок запроса
 * @param projectTokens - Все токены проекта
 * @param requestedTokenIds - Запрошенные ID токенов
 * @returns Список токенов либо описание ошибки при чужом/несуществующем токене
 */
function pickRequestedTokens(
  projectTokens: BotToken[],
  requestedTokenIds: number[],
): ResolvedProjectTokens {
  const byId = new Map(projectTokens.map((token) => [token.id, token]));
  const uniqueIds = Array.from(new Set(requestedTokenIds));
  const foreignIds = uniqueIds.filter((id) => !byId.has(id));

  if (foreignIds.length > 0) {
    return {
      tokens: [],
      error: `Токены не принадлежат этому проекту: ${foreignIds.join(", ")}`,
    };
  }

  return { tokens: uniqueIds.map((id) => byId.get(id)!) };
}
