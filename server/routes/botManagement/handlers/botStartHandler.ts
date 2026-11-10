/**
 * @fileoverview Хендлер запуска бота проекта
 * @module botManagement/handlers/botStartHandler
 */

import type { Request, Response } from "express";
import { startBot } from "../../../bots/startBot";
import { storage } from "../../../storages/storage";
import { botStartErrorStatus } from "./botStartErrorStatus";
import { resolveActualBotStatus } from '../resolve-actual-bot-status';
import { setBotDesiredStatus } from '../../../bots/setBotDesiredStatus';

/**
 * Нормализует tokenId из тела (число, "42", "token_42").
 * @param raw - Сырое значение
 * @returns Числовой ID или undefined
 */
function parseTokenId(raw: unknown): number | undefined {
  if (typeof raw === "number" && !isNaN(raw)) return raw;
  if (typeof raw === "string") {
    const match = raw.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      return isNaN(n) ? undefined : n;
    }
  }
  return undefined;
}

/**
 * Запускает бота проекта по `tokenId` (или default токену).
 * Сырой `body.token` не принимается — только токены проекта.
 * @param req - params.id, body.tokenId
 * @param res - Ответ
 * @returns Promise<void>
 */
export async function handleBotStart(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: "Некорректный ID проекта" });
      return;
    }

    if (req.body?.token != null && req.body?.token !== "") {
      res.status(400).json({
        message: "Передайте tokenId проекта, сырой token не принимается",
      });
      return;
    }

    const tokenId = parseTokenId(req.body?.tokenId);
    const project = await storage.getBotProject(projectId);
    if (!project) {
      res.status(404).json({ message: "Проект не найден" });
      return;
    }

    let botToken: string | undefined;
    let actualTokenId: number | undefined;

    if (tokenId) {
      const selectedToken = await storage.getBotToken(tokenId);
      if (!selectedToken || selectedToken.projectId !== projectId) {
        res.status(403).json({ message: "Токен не принадлежит этому проекту" });
        return;
      }
      botToken = selectedToken.token;
      actualTokenId = selectedToken.id;
    } else {
      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (defaultToken) {
        botToken = defaultToken.token;
        actualTokenId = defaultToken.id;
      }
    }

    if (!botToken || !actualTokenId) {
      res.status(400).json({ message: "Требуется токен бота" });
      return;
    }

    let existingInstance = await storage.getBotInstanceByToken(actualTokenId);
    if (existingInstance && await resolveActualBotStatus(projectId, actualTokenId, existingInstance) === 'running') {
      res.status(400).json({ message: "Бот уже запущен" });
      return;
    }

    if (!existingInstance) {
      existingInstance = await storage.createBotInstance({
        projectId, tokenId: actualTokenId, token: botToken, status: 'stopped',
      });
    }
    await setBotDesiredStatus(existingInstance.id, 'running');
    const result = await startBot(projectId, botToken, actualTokenId);
    if (result.success) {
      await storage.markTokenAsUsed(actualTokenId);
      res.json({
        message: "Команда запуска бота принята",
        processId: result.processId,
        tokenUsed: true,
      });
    } else {
      const failedInstance = await storage.getBotInstanceByToken(actualTokenId);
      const failureMessage = failedInstance?.errorMessage?.includes('TBB_BUILD_LINK_EXPIRED:')
        ? failedInstance.errorMessage
        : result.error || 'Не удалось запустить бота';
      await storage.updateBotInstance(existingInstance.id, {
        status: 'error', errorMessage: failureMessage,
      });
      res.status(botStartErrorStatus(result.error)).json({ message: result.error || "Не удалось запустить бота" });
    }
  } catch {
    res.status(500).json({ message: "Не удалось запустить бота" });
  }
}
