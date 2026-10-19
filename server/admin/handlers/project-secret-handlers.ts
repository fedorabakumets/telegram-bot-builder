/**
 * @fileoverview Явное раскрытие секретов проекта в административном режиме
 * @module server/admin/handlers/project-secret-handlers
 */

import type { Request, Response } from "express";
import { storage } from "../../storages/storage";
import { recordAdminAction } from "../admin-audit";

/**
 * Возвращает токен бота только по отдельному административному запросу.
 * @param req - Запрос с идентификаторами проекта и токена
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function handleGetAdminBotTokenSecret(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  const tokenId = Number(req.params.tokenId);
  if (!Number.isInteger(projectId) || !Number.isInteger(tokenId)) {
    res.status(400).json({ message: "Неверный идентификатор проекта или токена" });
    return;
  }

  const token = await storage.getBotToken(tokenId);
  if (!token || token.projectId !== projectId) {
    res.status(404).json({ message: "Токен не найден" });
    return;
  }

  await recordAdminAction(req, projectId, "project.secret.reveal", 200);
  res.json({ token: token.token, tokenId });
}
