/**
 * @fileoverview Хендлер обновления переменной окружения
 * @module userProjectsTokens/handlers/envVariables/updateEnvVariableHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getBotActorId } from "../../../../middleware/bot-api-actor";
import { validateRuntimeModeRename, writeRuntimeModeEnv } from './runtimeModeEnvWrite';

/**
 * Обновляет значение и/или флаг секретности переменной окружения.
 *
 * @param req - Запрос с params.id, query.telegram_id, body: { key?, value?, isSecret? }
 * @param res - Ответ: обновлённая переменная или ошибка
 */
export async function updateEnvVariableHandler(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = getBotActorId(req);
    const variableId = parseInt(req.params.id, 10);

    if (telegramId === null) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
      }

    if (isNaN(variableId)) {
      res.status(400).json({ error: "Некорректный id переменной" });
      return;
    }

    const variable = await storage.getEnvVariable(variableId);
    if (!variable) {
      res.status(404).json({ error: "Переменная не найдена" });
      return;
    }

    const token = await storage.getBotToken(variable.tokenId);
    if (!token) {
      res.status(404).json({ error: "Токен не найден" });
      return;
    }

    if (!(await storage.hasProjectAccess(token.projectId, telegramId))) {
      res.status(403).json({ error: "Нет доступа" });
      return;
    }

    /** Запрещаем обход проверки режима переименованием произвольного ключа. */
    validateRuntimeModeRename(variable.key, req.body?.key);
    /** Собираем данные для обновления */
    const updateData: Record<string, any> = {};
    if (req.body?.key !== undefined) updateData.key = req.body.key;
    if (req.body?.value !== undefined) updateData.value = req.body.value;
    if (req.body?.isSecret !== undefined) updateData.isSecret = req.body.isSecret;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Нет данных для обновления" });
      return;
    }

    /** Проверяем уникальность нового ключа */
    if (updateData.key && updateData.key !== variable.key) {
      const existing = await storage.getEnvVariables(variable.tokenId);
      if (existing.some(v => v.key === updateData.key && v.id !== variableId)) {
        res.status(409).json({ error: `Переменная ${updateData.key} уже существует` });
        return;
      }
    }

    /** Для режима используется общая транзакция проверки транспорта и значения. */
    const updated = variable.key === 'BOT_POLLING_MODE'
      ? await writeRuntimeModeEnv(variable.tokenId, token.projectId, req.body?.value ?? variable.value)
      : await storage.updateEnvVariable(variableId, updateData);

    if (!updated) {
      res.status(500).json({ error: "Не удалось обновить переменную" });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    if (error?.status === 400 || error?.status === 404) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("Ошибка обновления env переменной:", error);
    res.status(500).json({ error: "Не удалось обновить переменную" });
  }
}
