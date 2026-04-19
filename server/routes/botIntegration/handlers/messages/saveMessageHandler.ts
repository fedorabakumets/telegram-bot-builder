/**
 * @fileoverview Хендлер сохранения сообщения с безопасным резолвом tokenId проекта
 * @module botIntegration/handlers/messages/saveMessageHandler
 */

import type { Request, Response } from "express";
import { insertBotMessageSchema } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import {
  getRequestTokenId,
  resolveEffectiveProjectToken,
} from "../../../utils/resolve-request-token";

/**
 * Обрабатывает запрос на сохранение сообщения
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
 */
export async function saveMessageHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const requestedTokenId = getRequestTokenId(req);

    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const { effectiveTokenId } = await resolveEffectiveProjectToken(projectId, requestedTokenId);
    const validationResult = insertBotMessageSchema.safeParse({
      ...req.body,
      projectId,
      tokenId: effectiveTokenId ?? requestedTokenId ?? 0,
    });

    if (!validationResult.success) {
      res.status(400).json({
        message: "Неверные данные сообщения",
        errors: validationResult.error.errors,
      });
      return;
    }

    const message = await storage.createBotMessage(validationResult.data);
    res.json({ message: "Сообщение успешно сохранено", data: message });
  } catch (error) {
    console.error("Ошибка сохранения сообщения:", error);
    res.status(500).json({ message: "Не удалось сохранить сообщение" });
  }
}
