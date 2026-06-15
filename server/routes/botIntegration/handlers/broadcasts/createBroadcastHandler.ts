/**
 * @fileoverview Хендлер создания и запуска рассылки
 * @module botIntegration/handlers/broadcasts/createBroadcastHandler
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../../../storages/storage";
import { broadcastFiltersSchema } from "@shared/schema";
import { getRequestTokenId, resolveEffectiveProjectToken } from "../../../utils/resolve-request-token";
import { runBroadcastQueue } from "./broadcastQueue";

/** Схема тела запроса на создание рассылки */
const createBroadcastBodySchema = z.object({
  /** Название рассылки */
  name: z.string().min(1, "Название обязательно"),
  /** HTML-текст сообщения */
  messageText: z.string().min(1, "Текст сообщения обязателен"),
  /** URL медиафайлов для отправки */
  mediaUrls: z.array(z.string()).default([]),
  /** Инлайн-кнопки сообщения рассылки */
  buttons: z.array(z.any()).default([]),
  /** Фильтры аудитории */
  filters: broadcastFiltersSchema.default({}),
  /** ID токена бота */
  tokenId: z.number().int().positive().optional(),
});

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts
 * Создаёт рассылку и запускает очередь отправки асинхронно
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
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
    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(projectId, requestedTokenId);

    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const { name, messageText, mediaUrls, buttons, filters } = validation.data;

    // Подсчитываем аудиторию
    const users = await storage.getUsersForBroadcast(projectId, effectiveTokenId, filters);
    const totalCount = users.length;

    const broadcast = await storage.createBroadcast({
      projectId,
      tokenId: effectiveTokenId,
      name,
      messageText,
      mediaUrls,
      buttons,
      filters,
      status: "running",
      totalCount,
      startedAt: new Date(),
    });

    // Запускаем очередь асинхронно (fire-and-forget)
    runBroadcastQueue(broadcast.id, selectedToken.token).catch(err => {
      console.error(`[broadcast] Ошибка очереди рассылки ${broadcast.id}:`, err);
    });

    res.status(201).json({ broadcastId: broadcast.id });
  } catch (error) {
    console.error("[createBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
