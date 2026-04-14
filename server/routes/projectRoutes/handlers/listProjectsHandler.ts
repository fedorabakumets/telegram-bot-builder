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
import { getOwnerIdFromRequest, getSessionIdFromRequest } from "../../../telegram/auth-middleware";
import { ensureDefaultProject } from "../../../utils/ensureDefaultProject";

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
        const ownerId = getOwnerIdFromRequest(req);
        let projects;

        if (ownerId !== null) {
            // Авторизованный: только свои проекты, без гостевых
            projects = await storage.getUserBotProjects(ownerId);
        } else {
            // Гость: свои по sessionId + старые общие (sessionId = NULL)
            const sessionId = getSessionIdFromRequest(req);
            projects = sessionId
                ? await storage.getGuestBotProjectsBySession(sessionId)
                : await storage.getGuestBotProjects();

            // Если у гостя нет проектов — создаём дефолтный для его сессии
            if (projects.length === 0 && sessionId) {
                await ensureDefaultProject(sessionId);
                projects = await storage.getGuestBotProjectsBySession(sessionId);
            }
        }

        const projectsList = projects.map(({ data, ...metadata }) => metadata);
        res.json(projectsList);
    } catch (error) {
        res.status(500).json({ message: "Не удалось получить список проектов" });
    }
}
