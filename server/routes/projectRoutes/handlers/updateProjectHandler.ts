/**
 * @fileoverview Хендлер обновления проекта
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление проекта.
 *
 * @module projectRoutes/handlers/updateProjectHandler
 */

import type { Request, Response } from "express";
import { insertBotProjectSchema } from "@shared/schema";
import { z } from "zod";
import { storage } from "../../../storages/storage";
import type { StorageBotProjectUpdate } from "../../../storages/storageTypes";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { restartBotIfRunning } from "../../../bots/restartBotIfRunning";

/**
 * Обрабатывает запрос на обновление проекта
 *
 * @function updateProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId) || !projectId) {
            res.status(400).json({
                message: 'Неверный ID проекта',
                error: 'ID проекта должен быть числом'
            });
            return;
        }

        const ownerId = getOwnerIdFromRequest(req);
        if (ownerId !== null) {
            const existingProject = await storage.getBotProject(projectId);
            if (!existingProject) {
                res.status(404).json({ message: "Проект не найден" });
                return;
            }
            const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
            if (!hasAccess) {
                res.status(403).json({ message: "Нет прав на редактирование проекта" });
                return;
            }
        }

        const validatedData = insertBotProjectSchema
            .partial()
            .parse(req.body) as StorageBotProjectUpdate;
        const project = await storage.updateBotProject(projectId, validatedData);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        if (validatedData.data && validatedData.restartOnUpdate) {
            console.log(`Проект ${projectId} обновлен, проверяем необходимость перезапуска бота...`);
            const restartResult = await restartBotIfRunning(projectId);
            if (!restartResult.success) {
                console.error(`Ошибка перезапуска бота ${projectId}:`, restartResult.error);
            }
        }

        res.json(project);
    } catch (error) {
        console.error("Ошибка обновления проекта:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Неверные данные", errors: error.errors });
        } else {
            res.status(500).json({ message: "Не удалось обновить проект", error: (error as Error).message });
        }
    }
}
