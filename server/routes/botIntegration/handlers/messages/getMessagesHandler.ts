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
import { getUserDialogHistory } from '../../../dialogs/user-dialog-history';

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
        const requestedTokenId = getRequestTokenId(req);
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const messageType = req.query.messageType === 'user' || req.query.messageType === 'bot' 
            ? req.query.messageType 
            : undefined;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        /** Явный токен проверяем без переключения на другого бота. */
        const token = requestedTokenId
            ? await storage.getBotToken(requestedTokenId)
            : await storage.getDefaultBotToken(projectId);
        if (!token || token.projectId !== projectId || (req.query.tokenId !== undefined && !requestedTokenId)) {
            res.status(404).json({ message: 'Бот проекта не найден' });
            return;
        }
        if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
            res.status(400).json({ message: 'Неверное ограничение сообщений' });
            return;
        }
        /** Общую историю включает только панель диалогов; остальные потребители сохраняют личную выборку. */
        if (req.query.includeGroupContext === 'true') {
            res.json(await getUserDialogHistory(projectId, token.id, userId, limit, messageType));
        } else {
            const messages = await storage.getBotMessagesWithMedia(projectId, userId, limit, 'desc', messageType, token.id);
            res.json(messages.reverse());
        }
    } catch (error) {
        console.error("Ошибка получения сообщений:", error);
        res.status(500).json({ message: "Не удалось получить сообщения" });
    }
}
