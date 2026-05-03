/**
 * @fileoverview Хендлер получения сообщений пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение сообщений пользователя с медиа.
 *
 * @module botIntegration/handlers/messages/getMessagesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";

/**
 * Обрабатывает запрос на получение сообщений
 *
 * @function getMessagesHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getMessagesHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.params.userId;
        const tokenId = getRequestTokenId(req);
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const messageType = req.query.messageType === 'user' || req.query.messageType === 'bot' 
            ? req.query.messageType 
            : undefined;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        // Всегда берём последние N сообщений (DESC), затем реверсируем для хронологического порядка
        const messages = await storage.getBotMessagesWithMedia(projectId, userId, limit, 'desc', messageType, tokenId);
        res.json(messages.reverse());
    } catch (error) {
        console.error("Ошибка получения сообщений:", error);
        res.status(500).json({ message: "Не удалось получить сообщения" });
    }
}
