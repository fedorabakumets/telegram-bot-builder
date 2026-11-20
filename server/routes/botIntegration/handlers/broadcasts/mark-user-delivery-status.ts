/**
 * @fileoverview Пометка пользователя бота после ошибки доставки рассылки
 * @module botIntegration/handlers/broadcasts/mark-user-delivery-status
 */

import { storage } from "../../../../storages/storage";

/**
 * Разбирает ошибку Telegram в статус результата рассылки
 * @param errorCode - Код ошибки Telegram
 * @param description - Описание ошибки
 * @returns blocked | not_found | failed
 */
export function resolveBroadcastErrorStatus(
  errorCode?: number,
  description?: string,
): "blocked" | "not_found" | "failed" {
  const text = (description ?? "").toLowerCase();
  if (text.includes("user is deactivated") || text.includes("user_deactivated") || text.includes("user is deleted")) {
    return "not_found";
  }
  /** Отказ токена, отключение бота и отсутствие чата не подтверждают блокировку пользователем. */
  if (errorCode === 403 && text.includes("bot was blocked by the user")) {
    return "blocked";
  }
  return "failed";
}

/**
 * Ставит is_blocked или is_deleted у пользователя после ошибки рассылки
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param userId - Telegram user id (строка или число)
 * @param status - blocked | not_found
 */
export async function markUserAfterBroadcastError(
  projectId: number,
  tokenId: number,
  userId: string | number,
  status: "blocked" | "not_found",
): Promise<void> {
  try {
    if (status === "blocked") {
      await storage.markBotUserBlocked(projectId, tokenId, Number(userId));
    } else {
      await storage.markBotUserDeleted(projectId, tokenId, Number(userId));
    }
  } catch (error) {
    console.warn(
      `[broadcast] Не удалось пометить user=${userId} status=${status}:`,
      error,
    );
  }
}
