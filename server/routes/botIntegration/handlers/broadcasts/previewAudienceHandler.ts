/**
 * @fileoverview Хендлер предпросмотра аудитории рассылки
 * @module botIntegration/handlers/broadcasts/previewAudienceHandler
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../../../storages/storage";
import { broadcastFiltersSchema } from "@shared/schema";
import { getRequestTokenId, resolveEffectiveProjectToken } from "../../../utils/resolve-request-token";

/** Схема тела запроса предпросмотра аудитории */
const previewAudienceBodySchema = z.object({
  /** Фильтры аудитории */
  filters: broadcastFiltersSchema.default({}),
  /** ID токена бота */
  tokenId: z.number().int().positive().optional(),
});

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts/preview-audience
 * Подсчитывает количество пользователей по фильтрам и возвращает 3 примера
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
 */
export async function previewAudienceHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const validation = previewAudienceBodySchema.safeParse(req.body);
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

    const { filters } = validation.data;
    const users = await storage.getUsersForBroadcast(projectId, effectiveTokenId, filters);

    res.json({
      count: users.length,
      sample: users.slice(0, 3),
    });
  } catch (error) {
    console.error("[previewAudienceHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
