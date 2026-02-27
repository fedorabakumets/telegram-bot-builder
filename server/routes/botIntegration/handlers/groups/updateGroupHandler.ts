/**
 * @fileoverview Хендлер обновления группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление группы бота.
 *
 * @module botIntegration/handlers/groups/updateGroupHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на обновление группы
 *
 * @function updateGroupHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateGroupHandler(req: Request, res: Response): Promise<void> {
    try {
        const groupId = parseInt(req.params.groupId);

        if (isNaN(groupId)) {
            res.status(400).json({ message: "Неверный ID группы" });
            return;
        }

        const group = await storage.updateBotGroup(groupId, req.body);
        if (!group) {
            res.status(404).json({ message: "Группа не найдена" });
            return;
        }

        res.json(group);
    } catch (error) {
        console.error("Failed to update group:", error);
        res.status(500).json({ message: "Не удалось обновить группу" });
    }
}
