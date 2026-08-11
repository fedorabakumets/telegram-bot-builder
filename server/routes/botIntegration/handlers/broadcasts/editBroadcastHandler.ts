/**
 * @fileoverview Хендлер редактирования рассылки — обновляет текст в Telegram и в БД
 * @module botIntegration/handlers/broadcasts/editBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, broadcastResults, botMessages, botTokens } from "@shared/schema";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { editBroadcastBodySchema } from "./broadcast-body-schemas";
import {
  editTelegramBroadcastMessage,
  throttleBroadcastTelegramOps,
} from "./broadcast-telegram-ops";

/**
 * Обрабатывает PUT /api/projects/:projectId/broadcasts/:broadcastId
 * Редактирует текст рассылки в Telegram у получателей и обновляет БД
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function editBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId)) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    const validation = editBroadcastBodySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Неверное тело запроса", errors: validation.error.errors });
      return;
    }

    const { messageText } = validation.data;

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

    let edited = 0;
    let failed = 0;

    if (tokenRecord?.token && results.length > 0) {
      for (const r of results) {
        const ok = await editTelegramBroadcastMessage(
          tokenRecord.token,
          r.userId,
          r.telegramMessageId!,
          messageText,
        );
        if (ok) edited++;
        else failed++;
        await throttleBroadcastTelegramOps(results.length);
      }
    }

    await db.update(broadcasts).set({ messageText }).where(eq(broadcasts.id, broadcastId));

    await db
      .update(botMessages)
      .set({ messageText })
      .where(
        and(
          eq(botMessages.projectId, projectId),
          sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`,
        ),
      );

    const allResults = await db
      .select()
      .from(broadcastResults)
      .where(eq(broadcastResults.broadcastId, broadcastId));

    for (const r of allResults) {
      await broadcastProjectEvent(projectId, {
        type: "message-edited",
        projectId,
        tokenId: broadcast.tokenId,
        data: { messageId: 0, userId: r.userId, messageText },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ ok: true, edited, failed });
  } catch (error) {
    console.error("[editBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
