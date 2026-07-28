/**
 * @fileoverview Хендлер обновления срока хранения сообщений токена
 *
 * Сохраняет messages_retention_days на bot_tokens. Значение 0 отключает
 * автоочистку; N > 0 — серверная джоба удаляет bot_messages токена старше N дней.
 * После успеха эмитит WS token-updated (live UI / MCP).
 *
 * @module userProjectsTokens/handlers/tokens/updateMessagesRetentionHandler
 * @route PUT /api/projects/:projectId/tokens/:tokenId/messages-retention
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../../../../storages/storage";
import {
  isMessagesRetentionDays,
  MESSAGES_RETENTION_DAYS_VALUES,
} from "@shared/messages-retention";
import { emitTokenUpdated } from "../../../../terminal/emitTokenUpdated";

/** Тело запроса обновления срока хранения */
const bodySchema = z.object({
  /** Срок в днях: 0 или 7/30/60/90/180/365 */
  messagesRetentionDays: z.number().int(),
});

/**
 * Обновляет срок хранения сообщений для токена бота
 * @param req - Express-запрос (params: projectId, tokenId; body: messagesRetentionDays)
 * @param res - Express-ответ
 * @returns Promise<void>
 */
export async function updateMessagesRetentionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const tokenId = parseInt(req.params.tokenId, 10);
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(tokenId) || isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID токена или проекта" });
      return;
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Неверные данные",
        errors: parsed.error.errors,
      });
      return;
    }

    const { messagesRetentionDays } = parsed.data;
    if (!isMessagesRetentionDays(messagesRetentionDays)) {
      res.status(400).json({
        message: `messagesRetentionDays должен быть одним из: ${MESSAGES_RETENTION_DAYS_VALUES.join(", ")}`,
      });
      return;
    }

    const updated = await storage.updateBotToken(tokenId, { messagesRetentionDays });
    if (!updated) {
      res.status(404).json({ message: "Токен не найден" });
      return;
    }

    void emitTokenUpdated({
      projectId,
      tokenId,
      changedFields: ['messagesRetentionDays'],
      source: 'api',
    }).catch((err) => console.error('[messages-retention] emitTokenUpdated:', err));

    res.json({ success: true, messagesRetentionDays });
  } catch (error) {
    console.error("[messages-retention] Ошибка обновления:", error);
    res.status(500).json({ message: "Ошибка обновления срока хранения сообщений" });
  }
}
