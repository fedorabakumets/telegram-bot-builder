/**
 * @fileoverview Резолв списка токенов ботов проекта для «большой рассылки»
 * с проверкой принадлежности каждого токена проекту
 * @module botIntegration/handlers/broadcasts/resolve-project-token-ids
 */

import type { BotToken } from "@shared/schema";
import {
  isTokenActiveForBroadcast,
  NO_ACTIVE_BOT_TOKENS_ERROR,
  BOT_UNAUTHORIZED_HINT,
} from "@shared/broadcast-unauthorized";
import { storage } from "../../../../storages/storage";

/** Результат резолва списка токенов проекта */
export interface ResolvedProjectTokens {
  /** Найденные токены проекта (пусто при ошибке) */
  tokens: BotToken[];
  /** Текст ошибки для ответа 400, если резолв не удался */
  error?: string;
}

/**
 * Возвращает только активные токены либо ошибку, если таких нет
 * @param tokens - Кандидаты на рассылку
 * @param emptyError - Текст, если после фильтра список пуст
 * @returns Активные токены или ошибка
 */
function keepActiveOrError(tokens: BotToken[], emptyError: string): ResolvedProjectTokens {
  const active = tokens.filter((token) => isTokenActiveForBroadcast(token.isActive));
  if (active.length === 0) return { tokens: [], error: emptyError };
  return { tokens: active };
}

/**
 * Возвращает токены проекта для рассылки.
 * Приоритет: явный tokenIds → одиночный tokenId → все токены проекта («все боты»).
 * Неактивные токены (отозванные Telegram) в рассылку не попадают.
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
    return keepActiveOrError([single], BOT_UNAUTHORIZED_HINT);
  }

  return keepActiveOrError(projectTokens, NO_ACTIVE_BOT_TOKENS_ERROR);
}

/**
 * Отбирает запрошенные токены из токенов проекта, сохраняя порядок запроса
 * @param projectTokens - Все токены проекта
 * @param requestedTokenIds - Запрошенные ID токенов
 * @returns Список активных токенов либо описание ошибки
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

  const picked = uniqueIds.map((id) => byId.get(id)!);
  return keepActiveOrError(picked, NO_ACTIVE_BOT_TOKENS_ERROR);
}
