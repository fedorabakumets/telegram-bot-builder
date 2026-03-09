/**
 * @fileoverview Хендлер удаления сообщений пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на удаление истории сообщений пользователя.
 *
 * @module botIntegration/handlers/messages/deleteMessagesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на удаление сообщений
 *
 * @function deleteMessagesHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function deleteMessagesHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.params.userId;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const success = await storage.deleteBotMessages(projectId, userId);
        res.json({ message: "Сообщения успешно удалены", deleted: success });
    } catch (error) {
        console.error("Ошибка удаления сообщений:", error);
        res.status(500).json({ message: "Не удалось удалить сообщения" });
    }
}
