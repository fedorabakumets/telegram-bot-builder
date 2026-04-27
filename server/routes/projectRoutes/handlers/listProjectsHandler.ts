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
        }

        const projectsList = projects.map(({ data, ...metadata }) => {
            // Считаем узлы и листы из data не передавая весь объект клиенту
            let nodeCount = 0;
            let sheetsCount = 0;
            if (data && typeof data === 'object') {
                const d = data as any;
                if (Array.isArray(d.sheets)) {
                    sheetsCount = d.sheets.length;
                    nodeCount = d.sheets.reduce((sum: number, s: any) => sum + (s.nodes?.length || 0), 0);
                } else if (Array.isArray(d.nodes)) {
                    sheetsCount = 1;
                    nodeCount = d.nodes.length;
                }
            }
            return { ...metadata, nodeCount, sheetsCount };
        });
        res.json(projectsList);
    } catch (error) {
        res.status(500).json({ message: "Не удалось получить список проектов" });
    }
}
