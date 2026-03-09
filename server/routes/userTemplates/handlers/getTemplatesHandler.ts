/**
 * @fileoverview Хендлер получения шаблонов пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка шаблонов пользователя.
 *
 * @module userTemplates/handlers/getTemplatesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на получение шаблонов
 *
 * @function getTemplatesHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getTemplatesHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const templates = await storage.getUserBotTemplates(userId);
        res.json(templates);
    } catch (error: any) {
        console.error("Ошибка получения шаблонов:", error);
        res.status(500).json({ error: "Не удалось получить шаблоны" });
    }
}
