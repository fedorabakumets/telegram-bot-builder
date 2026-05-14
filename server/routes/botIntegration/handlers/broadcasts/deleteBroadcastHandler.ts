/**
 * @fileoverview Хендлер удаления рассылки из базы данных
 * @module botIntegration/handlers/broadcasts/deleteBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, botMessages } from "@shared/schema";

/**
 * Обрабатывает DELETE /api/projects/:projectId/broadcasts/:broadcastId
 * Удаляет рассылку и связанные сообщения из bot_messages
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId)) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    // Удаляем рассылку (каскадно удалит broadcast_results)
    const result = await db
      .delete(broadcasts)
      .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.projectId, projectId)));

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({ message: "Рассылка не найдена" });
      return;
    }

    // Удаляем связанные сообщения из bot_messages (broadcastId в messageData)
    await db
      .delete(botMessages)
      .where(
        and(
          eq(botMessages.projectId, projectId),
          sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`
        )
      );

    res.json({ ok: true });
  } catch (error) {
    console.error("[deleteBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
