/**
 * @fileoverview Хендлер сохранения сообщения
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на сохранение сообщения от бота в базу данных.
 *
 * @module botIntegration/handlers/messages/saveMessageHandler
 */

import type { Request, Response } from "express";
import { insertBotMessageSchema } from "@shared/schema";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на сохранение сообщения
 *
 * @function saveMessageHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function saveMessageHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const validationResult = insertBotMessageSchema.safeParse({ ...req.body, projectId });
        if (!validationResult.success) {
            res.status(400).json({
                message: "Неверные данные сообщения",
                errors: validationResult.error.errors
            });
            return;
        }

        const message = await storage.createBotMessage(validationResult.data);
        res.json({ message: "Сообщение успешно сохранено", data: message });
    } catch (error) {
        console.error("Ошибка сохранения сообщения:", error);
        res.status(500).json({ message: "Не удалось сохранить сообщение" });
    }
}
