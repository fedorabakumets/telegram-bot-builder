/**
 * @fileoverview Хендлер удаления рассылки — удаляет сообщения из Telegram и из БД
 * @module botIntegration/handlers/broadcasts/deleteBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, broadcastResults, botMessages, botTokens } from "@shared/schema";
import {
  deleteTelegramBroadcastMessage,
  throttleBroadcastTelegramOps,
} from "./broadcast-telegram-ops";

/**
 * Обрабатывает DELETE /api/projects/:projectId/broadcasts/:broadcastId
 * Удаляет сообщения из Telegram у получателей, затем рассылку и связанные записи из БД
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function deleteBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId)) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    const [broadcast] = await db
      .select()
      .from(broadcasts)
      .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.projectId, projectId)));

    if (!broadcast) {
      res.status(404).json({ message: "Рассылка не найдена" });
      return;
    }

    const [tokenRecord] = await db
      .select()
      .from(botTokens)
      .where(and(eq(botTokens.id, broadcast.tokenId), eq(botTokens.projectId, projectId)));

    const results = await db
      .select()
      .from(broadcastResults)
      .where(and(eq(broadcastResults.broadcastId, broadcastId), isNotNull(broadcastResults.telegramMessageId)));

    if (tokenRecord?.token && results.length > 0) {
      for (const r of results) {
        await deleteTelegramBroadcastMessage(tokenRecord.token, r.userId, r.telegramMessageId!);
        await throttleBroadcastTelegramOps(results.length);
      }
    }

    await db.delete(broadcasts).where(eq(broadcasts.id, broadcastId));

    await db
      .delete(botMessages)
      .where(
        and(
          eq(botMessages.projectId, projectId),
          sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`,
        ),
      );

    res.json({ ok: true, deleted: results.length });
  } catch (error) {
    console.error("[deleteBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
