/**
 * @fileoverview Хендлер удаления шаблона
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на удаление шаблона пользователя.
 *
 * @module userTemplates/handlers/deleteTemplateHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на удаление шаблона
 *
 * @function deleteTemplateHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function deleteTemplateHandler(req: Request, res: Response): Promise<void> {
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

        await storage.deleteBotTemplate(templateId);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления шаблона:", error);
        res.status(500).json({ error: "Не удалось удалить шаблон" });
    }
}
