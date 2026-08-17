/**
 * @fileoverview Сохраняет остановку рассылки из‑за недействительного токена
 * @module botIntegration/handlers/broadcasts/record-broadcast-unauthorized
 */

import { storage } from "../../../../storages/storage";
import { BOT_UNAUTHORIZED_RESULT_USER_ID } from "@shared/broadcast-unauthorized";
import { emitTokenUpdated } from "../../../../terminal/emitTokenUpdated";

/**
 * Пишет результат «токен недействителен» и помечает токен неактивным
 * @param broadcastId - Идентификатор рассылки
 * @param tokenId - Идентификатор токена бота
 * @param description - Сырое описание Telegram
 */
export async function recordBroadcastUnauthorized(
  broadcastId: number,
  tokenId: number,
  description?: string,
): Promise<void> {
  await storage.createBroadcastResult({
    broadcastId,
    userId: BOT_UNAUTHORIZED_RESULT_USER_ID,
    status: "failed",
    errorMessage: description ?? "Unauthorized",
  });
  const before = await storage.getBotToken(tokenId);
  await storage.updateBotToken(tokenId, { isActive: 0 });
  if (!before?.projectId) return;
  void emitTokenUpdated({
    projectId: before.projectId,
    tokenId,
    before,
    source: "api",
  }).catch((err) => console.error("[broadcast] emitTokenUpdated:", err));
}
