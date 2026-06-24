/**
 * @fileoverview Хендлер создания персонального токена агента (PAT)
 *
 * Валидирует тело запроса, вычисляет дату истечения и создаёт токен.
 * Полный секрет токена возвращается клиенту ОДИН раз.
 *
 * @module agentTokens/handlers/createAgentTokenHandler
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../../storages/storage";
import { toAgentTokenDto } from "../agent-token-dto";

/** Кол-во миллисекунд в одних сутках */
const DAY_MS = 86_400_000;

/** Схема валидации тела запроса на создание токена агента */
const createAgentTokenSchema = z.object({
  /** Пользовательское имя токена */
  label: z.string().min(1, "Название обязательно"),
  /** Права токена (read — только чтение, read,write — чтение и запись) */
  scopes: z.enum(["read", "read,write"]).optional().default("read,write"),
  /** Срок действия токена в днях (не указан — бессрочный) */
  expiresInDays: z.number().int().positive().optional(),
});

/**
 * Обрабатывает запрос на создание токена агента.
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns {Promise<void>}
 */
export async function createAgentTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Пользователь не аутентифицирован" });
      return;
    }

    const parsed = createAgentTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Некорректные данные", details: parsed.error.issues });
      return;
    }

    const { label, scopes, expiresInDays } = parsed.data;
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * DAY_MS) : null;

    const result = await storage.createAgentToken(userId, label, scopes, expiresAt);
    res.status(201).json({ token: result.token, record: toAgentTokenDto(result.record) });
  } catch (error: any) {
    console.error("Ошибка создания токена агента:", error);
    res.status(500).json({ error: "Не удалось создать токен агента" });
  }
}
