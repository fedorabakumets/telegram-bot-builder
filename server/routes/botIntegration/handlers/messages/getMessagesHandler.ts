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
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const messages = await storage.getBotMessagesWithMedia(projectId, userId, limit);
        res.json(messages);
    } catch (error) {
        console.error("Ошибка получения сообщений:", error);
        res.status(500).json({ message: "Не удалось получить сообщения" });
    }
}
