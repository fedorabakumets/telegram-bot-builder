/**
 * @fileoverview Хендлер сообщений группового чата проекта
 * @module botIntegration/handlers/messages/getGroupMessagesHandler
 */

import { getMessageContext } from './get-message-context';
import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";
import { assertProjectGroup } from "../../utils/assert-project-group";
import { getOlderGroupMessages } from './get-older-group-messages';
import { getDialogMessageCount } from './dialog-message-count';

/**
 * История сообщений группы (панель «Диалоги» для group/supergroup).
 * @param req - params: projectId, groupId; query: limit, tokenId
 * @param res - Ответ
 * @returns Promise<void>
 */
export async function getGroupMessagesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const groupId = req.params.groupId;
    const tokenId = getRequestTokenId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    if (!groupId) {
      res.status(400).json({ message: "Не указан ID группы" });
      return;
    }

    if (!(await assertProjectGroup(projectId, groupId, res))) return;

    /** Число записей передаётся отдельно, не меняя формат ответа. */
    const countToken = tokenId ? await storage.getBotToken(tokenId) : await storage.getDefaultBotToken(projectId);
    if (countToken?.projectId === projectId) res.set('X-Dialog-Message-Count', String(await getDialogMessageCount(projectId, countToken.id, groupId, true)));

    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      res.status(400).json({ message: 'Неверное ограничение сообщений' }); return;
    }
    if (req.query.beforeId !== undefined) {
      const beforeId = Number(req.query.beforeId);
      const token = tokenId ? await storage.getBotToken(tokenId) : await storage.getDefaultBotToken(projectId);
      if (!token || token.projectId !== projectId || (req.query.tokenId !== undefined && !tokenId)) {
        res.status(404).json({ message: 'Бот проекта не найден' }); return;
      }
      if (!Number.isSafeInteger(beforeId) || beforeId <= 0) {
        res.status(400).json({ message: 'Неверный курсор сообщений' }); return;
      }
      res.json(await getOlderGroupMessages(projectId, token.id, groupId, beforeId, limit)); return;
    }

    if (req.query.aroundMessageId !== undefined) {
      const token = tokenId ? await storage.getBotToken(tokenId) : await storage.getDefaultBotToken(projectId);
      if (!token || token.projectId !== projectId) { res.status(404).json({ message: "Бот проекта не найден" }); return; }
      const context = await getMessageContext(projectId, token.id, groupId, Number(req.query.aroundMessageId), true);
      if (!context) { res.status(404).json({ message: "Сообщение не найдено в этом чате" }); return; }
      res.json(context); return;
    }
    const messages = await storage.getGroupChatMessages(projectId, groupId, limit, tokenId);
    res.json(messages.reverse());
  } catch (error) {
    console.error("Ошибка получения сообщений группы:", error);
    res.status(500).json({ message: "Не удалось получить сообщения группы" });
  }
}
