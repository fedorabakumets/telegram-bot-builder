/**
 * @fileoverview Хендлер создания шаблона
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на создание нового шаблона пользователя.
 *
 * @module userTemplates/handlers/createTemplateHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на создание шаблона
 *
 * @function createTemplateHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function createTemplateHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const template = await storage.createBotTemplate({
            ...req.body,
            ownerId: userId
        });
        res.json(template);
    } catch (error: any) {
        console.error("Ошибка создания шаблона:", error);
        res.status(500).json({ error: "Не удалось создать шаблон" });
    }
}
