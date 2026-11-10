/**
 * @fileoverview Хендлер получения сообщений пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение сообщений пользователя с медиа.
 *
 * @module botIntegration/handlers/messages/getMessagesHandler
 */

import { getMessageContext } from './get-message-context';
import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";
import { getUserDialogHistory } from '../../../dialogs/user-dialog-history';
import { getDialogMessageCount } from './dialog-message-count';

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
        /** Курсор предыдущей страницы истории. */
        const beforeId = req.query.beforeId === undefined ? undefined : Number(req.query.beforeId);
        if (beforeId !== undefined && (!Number.isSafeInteger(beforeId) || beforeId <= 0)) {
            res.status(400).json({ message: 'Неверный курсор сообщений' }); return;
        }
        if (req.query.aroundMessageId !== undefined) {
            const context = await getMessageContext(projectId, token.id, userId, Number(req.query.aroundMessageId));
            if (!context) { res.status(404).json({ message: "Сообщение не найдено в этом диалоге" }); return; }
            res.json(context); return;
        }
        /** Общую историю включает только панель диалогов; остальные потребители сохраняют личную выборку. */
        if (req.query.includeGroupContext === 'true') {
            res.set('X-Dialog-Message-Count', String(await getDialogMessageCount(projectId, token.id, userId, false)));
            res.json(await getUserDialogHistory(projectId, token.id, userId, limit, messageType, beforeId));
        } else {
            const messages = await storage.getBotMessagesWithMedia(projectId, userId, limit, 'desc', messageType, token.id);
            res.json(messages.reverse());
        }
    } catch (error) {
        console.error("Ошибка получения сообщений:", error);
        res.status(500).json({ message: "Не удалось получить сообщения" });
    }
}
