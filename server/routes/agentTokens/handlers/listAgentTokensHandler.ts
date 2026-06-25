/**
 * @fileoverview Хендлер получения списка персональных токенов агента (PAT)
 *
 * Возвращает токены текущего пользователя в виде безопасных DTO (без секрета).
 *
 * @module agentTokens/handlers/listAgentTokensHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { toAgentTokenDto } from "../agent-token-dto";

/**
 * Обрабатывает запрос на получение списка токенов агента владельца.
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns {Promise<void>}
 */
export async function listAgentTokensHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Пользователь не аутентифицирован" });
      return;
    }

    const tokens = await storage.getAgentTokensByOwner(userId);
    res.json(tokens.map(toAgentTokenDto));
  } catch (error: any) {
    console.error("Ошибка получения токенов агента:", error);
    res.status(500).json({ error: "Не удалось получить токены агента" });
  }
}
