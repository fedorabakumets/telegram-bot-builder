/**
 * @fileoverview Утилиты для чтения tokenId из HTTP-запроса и безопасного резолва токена проекта
 * @module server/routes/utils/resolve-request-token
 */

import type { Request } from "express";
import type { BotToken } from "@shared/schema";
import { storage } from "../../storages/storage";

/**
 * Результат резолва токена проекта
 */
export interface ResolvedProjectToken {
  /** Найденный токен проекта или `undefined`, если резолв не удался */
  selectedToken?: BotToken;
  /** Эффективный `tokenId` для чтения и записи данных или `null`, если токен не найден */
  effectiveTokenId: number | null;
}

/**
 * Нормализует tokenId из query/body/params в число
 * @param rawTokenId - Сырое значение tokenId
 * @returns Нормализованный tokenId или null
 */
export function parseOptionalTokenId(rawTokenId: unknown): number | null {
  if (rawTokenId === null || rawTokenId === undefined || rawTokenId === "") {
    return null;
  }

  const tokenId = Number(rawTokenId);
  return Number.isInteger(tokenId) && tokenId > 0 ? tokenId : null;
}

/**
 * Извлекает tokenId из query, body или params запроса
 * @param req - HTTP-запрос
 * @returns Нормализованный tokenId или null
 */
export function getRequestTokenId(req: Request): number | null {
  return parseOptionalTokenId(
    req.query.tokenId ?? req.body?.tokenId ?? req.params.tokenId
  );
}

/**
 * Возвращает выбранный токен бота или дефолтный токен проекта
 * @param projectId - Идентификатор проекта
 * @param tokenId - Необязательный идентификатор выбранного токена
 * @returns Токен бота или undefined
 */
export async function resolveProjectBotToken(
  projectId: number,
  tokenId?: number | null
): Promise<BotToken | undefined> {
  if (tokenId) {
    const selectedToken = await storage.getBotToken(tokenId);
    if (selectedToken?.projectId === projectId) {
      return selectedToken;
    }
  }

  return storage.getDefaultBotToken(projectId);
}

/**
 * Возвращает эффективный tokenId для операций записи и точечной выборки
 * @param projectId - Идентификатор проекта
 * @param tokenId - Необязательный tokenId из запроса
 * @returns Идентификатор выбранного или дефолтного токена, либо null
 */
export async function resolveEffectiveProjectTokenId(
  projectId: number,
  tokenId?: number | null
): Promise<number | null> {
  const selectedToken = await resolveProjectBotToken(projectId, tokenId);
  return selectedToken?.id ?? null;
}

/**
 * Возвращает токен проекта вместе с эффективным tokenId для сегментированной записи
 * @param projectId - Идентификатор проекта
 * @param tokenId - Необязательный идентификатор токена из запроса
 * @returns Найденный токен и его эффективный идентификатор
 */
export async function resolveEffectiveProjectToken(
  projectId: number,
  tokenId?: number | null
): Promise<ResolvedProjectToken> {
  const selectedToken = await resolveProjectBotToken(projectId, tokenId);

  return {
    selectedToken,
    effectiveTokenId: selectedToken?.id ?? null,
  };
}
