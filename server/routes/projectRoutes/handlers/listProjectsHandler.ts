/**
 * @fileoverview Хендлер получения списка проектов (метаданные)
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка метаданных проектов.
 *
 * @module projectRoutes/handlers/listProjectsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { getCachedOrExecute } from "../../../utils/cache";

/**
 * Обрабатывает запрос на получение списка проектов
 *
 * @function listProjectsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function listProjectsHandler(req: Request, res: Response): Promise<void> {
    try {
        const { ids } = req.query;
        const ownerId = getOwnerIdFromRequest(req);
        let projects;

        if (ownerId !== null) {
            const userProjects = await storage.getUserBotProjects(ownerId);
            const guestProjects = await storage.getGuestBotProjects();
            projects = [...userProjects, ...guestProjects];
        } else {
            let allProjects = await getCachedOrExecute(
                'all-projects-list',
                async () => await storage.getAllBotProjects(),
                30000
            );

            if (ids && typeof ids === 'string') {
                const requestedIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
                projects = requestedIds.length > 0
                    ? allProjects.filter(p => requestedIds.includes(p.id))
                    : allProjects;
            } else {
                projects = allProjects;
            }
        }

        const projectsList = projects.map(({ data, ...metadata }) => metadata);
        res.json(projectsList);
    } catch (error) {
        res.status(500).json({ message: "Не удалось получить список проектов" });
    }
}
