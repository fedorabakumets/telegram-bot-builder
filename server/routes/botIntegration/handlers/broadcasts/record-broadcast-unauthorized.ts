/**
 * @fileoverview Сохраняет остановку рассылки из‑за недействительного токена
 * @module botIntegration/handlers/broadcasts/record-broadcast-unauthorized
 */

import { storage } from "../../../../storages/storage";
import { BOT_UNAUTHORIZED_RESULT_USER_ID } from "@shared/broadcast-unauthorized";
import { markBotTokenUnauthorized } from "../../../../bots/mark-bot-token-unauthorized";

/**
 * Пишет результат «токен недействителен» и помечает токен неактивным
 * @param broadcastId - Идентификатор рассылки
 * @param tokenId - Идентификатор токена бота
 * @param description - Сырое описание Telegram
 * @param expectedToken - Токен фактической попытки отправки, защищающий заменённые реквизиты
 */
export async function recordBroadcastUnauthorized(
  broadcastId: number,
  tokenId: number,
  description?: string,
  expectedToken?: string,
): Promise<void> {
  await storage.createBroadcastResult({
    broadcastId,
    userId: BOT_UNAUTHORIZED_RESULT_USER_ID,
    status: "failed",
    errorMessage: description ?? "Unauthorized",
  });
  const before = await storage.getBotToken(tokenId);
  if (!before?.projectId || !expectedToken) return;
  await markBotTokenUnauthorized(before.projectId, tokenId, expectedToken);
}
