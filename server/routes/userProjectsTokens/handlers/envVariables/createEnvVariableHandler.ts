/**
 * @fileoverview Хендлер создания переменной окружения
 * @module userProjectsTokens/handlers/envVariables/createEnvVariableHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { insertBotEnvVariableSchema } from "@shared/schema";
import { getBotActorId } from "../../../../middleware/bot-api-actor";

/**
 * Создаёт новую переменную окружения для токена.
 * Проверяет уникальность ключа в рамках токена.
 *
 * @param req - Запрос с params.tokenId, query.telegram_id, body: { key, value, isSecret }
 * @param res - Ответ: созданная переменная или ошибка
 */
export async function createEnvVariableHandler(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = getBotActorId(req);
    const tokenId = parseInt(req.params.tokenId, 10);

    if (telegramId === null) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
      }

    if (isNaN(tokenId)) {
      res.status(400).json({ error: "Некорректный tokenId" });
      return;
    }

    const token = await storage.getBotToken(tokenId);
    if (!token) {
      res.status(404).json({ error: "Токен не найден" });
      return;
    }

    if (!(await storage.hasProjectAccess(token.projectId, telegramId))) {
      res.status(403).json({ error: "Нет доступа" });
      return;
    }

    /** Валидация входных данных */
    const parsed = insertBotEnvVariableSchema.safeParse({
      tokenId,
      key: req.body?.key,
      value: req.body?.value ?? "",
      isSecret: req.body?.isSecret ?? 0,
    });

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || "Ошибка валидации" });
      return;
    }

    /** Проверяем уникальность ключа */
    const existing = await storage.getEnvVariables(tokenId);
    if (existing.some(v => v.key === parsed.data.key)) {
      res.status(409).json({ error: `Переменная ${parsed.data.key} уже существует` });
      return;
    }

    const variable = await storage.createEnvVariable(parsed.data);

    res.status(201).json(variable);
  } catch (error: any) {
    console.error("Ошибка создания env переменной:", error);
    res.status(500).json({ error: "Не удалось создать переменную" });
  }
}
