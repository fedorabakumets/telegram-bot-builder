/**
 * @fileoverview Хендлер создания и запуска рассылки
 * @module botIntegration/handlers/broadcasts/createBroadcastHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId, resolveEffectiveProjectToken } from "../../../utils/resolve-request-token";
import { createBroadcastBodySchema } from "./broadcast-body-schemas";
import { runBroadcastQueue } from "./broadcastQueue";

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts
 * Создаёт рассылку и запускает очередь отправки асинхронно
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function createBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const validation = createBroadcastBodySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Неверное тело запроса", errors: validation.error.errors });
      return;
    }

    const requestedTokenId = getRequestTokenId(req);
    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(
      projectId,
      requestedTokenId,
    );

    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const { name, messageText, mediaUrls, buttons, buttonsPerRow, filters } = validation.data;
    const users = await storage.getUsersForBroadcast(projectId, effectiveTokenId, filters);
    const totalCount = users.length;

    const broadcast = await storage.createBroadcast({
      projectId,
      tokenId: effectiveTokenId,
      name,
      messageText,
      mediaUrls,
      buttons,
      buttonsPerRow,
      filters,
      status: "running",
      totalCount,
      startedAt: new Date(),
    });

    runBroadcastQueue(broadcast.id, selectedToken.token).catch((err) => {
      console.error(`[broadcast] Ошибка очереди рассылки ${broadcast.id}:`, err);
    });

    res.status(201).json({ broadcastId: broadcast.id });
  } catch (error) {
    console.error("[createBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
