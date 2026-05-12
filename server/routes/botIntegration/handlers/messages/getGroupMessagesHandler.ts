/**
 * @fileoverview Хендлер получения сообщений группового чата
 * @module botIntegration/handlers/messages/getGroupMessagesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";

/**
 * Обрабатывает запрос на получение сообщений группового чата
 *
 * Возвращает все сообщения из bot_messages, где chat_id = groupId,
 * независимо от user_id отправителя.
 *
 * @param req - Объект запроса (params: projectId, groupId; query: limit, tokenId)
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function getGroupMessagesHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const groupId = req.params.groupId;
        const tokenId = getRequestTokenId(req);
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        if (!groupId) {
            res.status(400).json({ message: "Не указан ID группы" });
            return;
        }

        // Берём последние N сообщений (DESC), затем реверсируем для хронологии
        const messages = await storage.getGroupChatMessages(projectId, groupId, limit, tokenId);
        res.json(messages.reverse());
    } catch (error) {
        console.error("Ошибка получения сообщений группы:", error);
        res.status(500).json({ message: "Не удалось получить сообщения группы" });
    }
}
