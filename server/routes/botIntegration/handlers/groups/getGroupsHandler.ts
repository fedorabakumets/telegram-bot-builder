/**
 * @fileoverview Хендлер получения списка групп
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка групп проекта.
 *
 * @module botIntegration/handlers/groups/getGroupsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на получение групп
 *
 * @function getGroupsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        console.log("Получение групп для проекта", projectId);

        const groups = await storage.getBotGroupsByProject(projectId);
        console.log("Найдены группы:", groups);
        res.json(groups);
    } catch (error) {
        console.error("Ошибка получения групп:", error);
        res.status(500).json({ message: "Не удалось получить группы" });
    }
}
