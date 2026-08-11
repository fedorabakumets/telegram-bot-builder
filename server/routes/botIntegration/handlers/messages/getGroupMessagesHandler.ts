/**
 * @fileoverview Хендлер сообщений группового чата проекта
 * @module botIntegration/handlers/messages/getGroupMessagesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";
import { assertProjectGroup } from "../../utils/assert-project-group";

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

    const messages = await storage.getGroupChatMessages(projectId, groupId, limit, tokenId);
    res.json(messages.reverse());
  } catch (error) {
    console.error("Ошибка получения сообщений группы:", error);
    res.status(500).json({ message: "Не удалось получить сообщения группы" });
  }
}
