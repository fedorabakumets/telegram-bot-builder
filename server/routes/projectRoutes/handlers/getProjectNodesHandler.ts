/**
 * @fileoverview Хендлер получения узлов проекта
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение всех узлов проекта.
 *
 * @module projectRoutes/handlers/getProjectNodesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает запрос на получение узлов проекта
 *
 * @function getProjectNodesHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getProjectNodesHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);

        if (isNaN(projectId)) {
            res.status(400).json({
                message: "Неверный ID проекта",
                error: "ID проекта должен быть числом"
            });
            return;
        }

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const ownerId = getOwnerIdFromRequest(req);
        if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
            res.status(403).json({ message: "Нет прав доступа к проекту" });
            return;
        }

        // Извлекаем узлы из данных проекта
        const projectData = project.data as { nodes?: unknown[] } | null;
        const nodes = projectData?.nodes || [];

        res.json(nodes);
    } catch (error) {
        console.error("Ошибка получения узлов проекта:", error);
        res.status(500).json({ message: "Не удалось получить узлы проекта" });
    }
}
