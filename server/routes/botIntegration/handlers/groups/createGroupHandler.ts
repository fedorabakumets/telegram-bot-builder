/**
 * @fileoverview Хендлер создания группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на создание новой группы бота.
 *
 * @module botIntegration/handlers/groups/createGroupHandler
 */

import type { Request, Response } from "express";
import { insertBotGroupSchema } from "@shared/schema";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на создание группы
 *
 * @function createGroupHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function createGroupHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const result = insertBotGroupSchema.safeParse({ ...req.body, projectId });
        if (!result.success) {
            console.log("Validation errors:", JSON.stringify(result.error.errors, null, 2));
            res.status(400).json({
                message: "Неверные данные группы",
                errors: result.error.errors
            });
            return;
        }

        console.log("Validation successful, data:", JSON.stringify(result.data, null, 2));

        const group = await storage.createBotGroup(result.data);
        res.json(group);
    } catch (error) {
        console.error("Failed to create group:", error);
        res.status(500).json({ message: "Не удалось создать группу" });
    }
}
