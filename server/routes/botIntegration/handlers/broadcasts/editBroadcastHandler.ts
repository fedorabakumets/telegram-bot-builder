/**
 * @fileoverview Хендлер редактирования рассылки — обновляет текст в Telegram и в БД
 * @module botIntegration/handlers/broadcasts/editBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts } from "@shared/schema";
import { editBroadcastBodySchema } from "./broadcast-body-schemas";
import { editBroadcastMessages } from "./edit-broadcast-messages";

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

    const { edited, failed } = await editBroadcastMessages(
      projectId,
      broadcastId,
      broadcast.tokenId,
      messageText,
    );

    res.json({ ok: true, edited, failed });
  } catch (error) {
    console.error("[editBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
