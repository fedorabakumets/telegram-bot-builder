/**
 * @fileoverview Хендлер получения проекта по ID
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение конкретного проекта по идентификатору.
 *
 * @module projectRoutes/handlers/getProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { normalizeProjectData } from "../../../utils/normalizeProjectData";

/**
 * Обрабатывает запрос на получение проекта
 *
 * @function getProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id) || !id) {
            res.status(400).json({
                message: 'Неверный ID проекта',
                error: 'ID проекта должен быть числом'
            });
            return;
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const project = await storage.getBotProject(id);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const ownerId = getOwnerIdFromRequest(req);

        // Авторизованный пользователь — проверяем владельца или коллаборатора
        if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
            const isCollaborator = await storage.hasProjectAccess(id, ownerId);
            if (!isCollaborator) {
                res.status(403).json({ message: "Нет прав доступа к проекту" });
                return;
            }
        }

        const normalizedProject = normalizeProjectData(project);
        res.json(normalizedProject);
    } catch (error) {
        res.status(500).json({ message: "Не удалось получить проект" });
    }
}
