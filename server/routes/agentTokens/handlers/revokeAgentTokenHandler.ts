/**
 * @fileoverview Хендлер отзыва персонального токена агента (PAT)
 *
 * Отзывает токен только текущего пользователя (защита по ownerId).
 *
 * @module agentTokens/handlers/revokeAgentTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на отзыв токена агента по id.
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns {Promise<void>}
 */
export async function revokeAgentTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Пользователь не аутентифицирован" });
      return;
    }

    const id = parseInt(req.params.id);
    const ok = await storage.revokeAgentToken(id, userId);
    if (!ok) {
      res.status(404).json({ error: "Токен не найден" });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Ошибка отзыва токена агента:", error);
    res.status(500).json({ error: "Не удалось отозвать токен агента" });
  }
}
