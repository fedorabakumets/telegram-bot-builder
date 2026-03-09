/**
 * @fileoverview Хендлер удаления группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на удаление группы бота.
 *
 * @module botIntegration/handlers/groups/deleteGroupHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на удаление группы
 *
 * @function deleteGroupHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function deleteGroupHandler(req: Request, res: Response): Promise<void> {
    try {
        const groupId = parseInt(req.params.groupId);

        if (isNaN(groupId)) {
            res.status(400).json({ message: "Неверный ID группы" });
            return;
        }

        const success = await storage.deleteBotGroup(groupId);
        if (!success) {
            res.status(404).json({ message: "Группа не найдена" });
            return;
        }

        res.json({ message: "Группа успешно удалена" });
    } catch (error) {
        console.error("Ошибка удаления группы:", error);
        res.status(500).json({ message: "Не удалось удалить группу" });
    }
}
