/** @fileoverview Правка отправленных сообщений с сохранением клавиатуры и точными итогами. */
import { eq, and } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, broadcastResults, botTokens } from "@shared/schema";
import { extractButtonsFromNode } from "../messages/extract-buttons";
import { buildInlineKeyboard } from "../messages/send-telegram-message";
import { editTelegramBroadcastMessage, throttleBroadcastTelegramOps } from "./broadcast-telegram-ops";
import type { BroadcastMessageEditResult } from "./broadcast-telegram-ops";
import { acquireBroadcastEdit, BroadcastEditConflict, emptyBroadcastEditStats } from "./broadcast-edit-state";
import { persistBroadcastEdit } from "./persist-broadcast-edit";
export type { BroadcastEditStats } from "./broadcast-edit-state";

/**
 * Редактирует только отправленные сообщения выбранного бота и проекта.
 * @param projectId - Проект с проверенными правами доступа.
 * @param broadcastId - Отправленная рассылка.
 * @param tokenId - Бот этой рассылки.
 * @param messageText - Новый текст или подпись.
 * @returns Подтверждённые результаты Telegram и ошибки сохранения.
 */
export async function editBroadcastMessages(projectId: number, broadcastId: number,
  tokenId: number, messageText: string) {
  const release = acquireBroadcastEdit(broadcastId);
  try {
    const [broadcast] = await db.select().from(broadcasts).where(and(
      eq(broadcasts.id, broadcastId), eq(broadcasts.projectId, projectId), eq(broadcasts.tokenId, tokenId)));
    if (!broadcast) throw new Error("Рассылка не найдена в проекте");
    if (["running", "pending"].includes(broadcast.status)) {
      throw new BroadcastEditConflict("Сначала остановите отправку рассылки");
    }
    const [token] = await db.select().from(botTokens).where(and(
      eq(botTokens.id, tokenId), eq(botTokens.projectId, projectId)));
    const results = await db.select().from(broadcastResults).where(and(
      eq(broadcastResults.broadcastId, broadcastId), eq(broadcastResults.status, "sent")));
    const stats = emptyBroadcastEditStats();
    const buttons = (broadcast.buttons as unknown[]) ?? [];
    const inlineButtons = extractButtonsFromNode({ buttons });
    const replyMarkup = inlineButtons.length ? buildInlineKeyboard(inlineButtons, broadcast.buttonsPerRow ?? undefined)
      : { inline_keyboard: [] };
    const hasMedia = Array.isArray(broadcast.mediaUrls) && broadcast.mediaUrls.length > 0;
    for (const result of results) {
      if (!result.telegramMessageId || result.telegramMessageId < 1) { stats.skipped++; continue; }
      if (!token?.token) { stats.failed++; continue; }
      stats.attempted++;
      let response: BroadcastMessageEditResult;
      try {
        response = await editTelegramBroadcastMessage(token.token, result.userId,
          result.telegramMessageId, messageText, { replyMarkup, hasMedia });
      } catch { response = { status: "unknown" }; }
      stats[response.status]++;
      if (response.status === "edited" || response.status === "unchanged") {
        try {
          await persistBroadcastEdit(projectId, tokenId, broadcastId, result.userId,
            result.telegramMessageId, messageText, buttons, broadcast.buttonsPerRow);
        } catch {
          stats.persistenceFailed++;
        }
      }
      await throttleBroadcastTelegramOps(results.length);
    }
    if (stats.edited + stats.unchanged > 0 && stats.failed + stats.unknown + stats.skipped + stats.persistenceFailed === 0) {
      try {
        await db.update(broadcasts).set({ messageText }).where(and(
          eq(broadcasts.id, broadcastId), eq(broadcasts.projectId, projectId), eq(broadcasts.tokenId, tokenId)));
      } catch { stats.persistenceFailed++; }
    }
    return stats;
  } finally { release(); }
}
