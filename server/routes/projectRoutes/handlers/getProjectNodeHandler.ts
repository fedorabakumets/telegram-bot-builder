/**
 * @fileoverview Хендлер получения узла проекта по ID
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение конкретного узла проекта.
 *
 * @module projectRoutes/handlers/getProjectNodeHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает запрос на получение узла проекта по ID
 *
 * @function getProjectNodeHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getProjectNodeHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const nodeId = req.params.nodeId;

        if (isNaN(projectId)) {
            res.status(400).json({
                message: "Неверный ID проекта",
                error: "ID проекта должен быть числом"
            });
            return;
        }

        if (!nodeId) {
            res.status(400).json({
                message: "Неверный ID узла",
                error: "ID узла не указан"
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

        // Извлекаем узлы из данных проекта и ищем нужный
        const projectData = project.data as { nodes?: unknown[] } | null;
        const nodes = projectData?.nodes || [];
        const node = nodes.find((n: Record<string, unknown>) => n.id === nodeId);

        if (!node) {
            res.status(404).json({ message: "Узел не найден" });
            return;
        }

        res.json(node);
    } catch (error) {
        console.error("Ошибка получения узла проекта:", error);
        res.status(500).json({ message: "Не удалось получить узел проекта" });
    }
}
