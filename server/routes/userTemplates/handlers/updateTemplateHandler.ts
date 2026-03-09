/**
 * @fileoverview Хендлер обновления шаблона
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление шаблона пользователя.
 *
 * @module userTemplates/handlers/updateTemplateHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на обновление шаблона
 *
 * @function updateTemplateHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateTemplateHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        const templateId = parseInt(req.params.id);

        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const template = await storage.getBotTemplate(templateId);
        if (!template || template.ownerId !== userId) {
            res.status(403).json({ error: "Доступ запрещён" });
            return;
        }

        const updated = await storage.updateBotTemplate(templateId, req.body);
        res.json(updated);
    } catch (error: any) {
        console.error("Ошибка обновления шаблона:", error);
        res.status(500).json({ error: "Не удалось обновить шаблон" });
    }
}
