/**
 * @fileoverview Хендлер получения всех проектов
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение всех проектов с данными.
 *
 * @module projectRoutes/handlers/getAllProjectsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает запрос на получение всех проектов
 *
 * @function getAllProjectsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getAllProjectsHandler(req: Request, res: Response): Promise<void> {
    try {
        const ownerId = getOwnerIdFromRequest(req);
        // Личность гарантирована requireApiAuth; без владельца — пустой список (defense-in-depth)
        const projects = ownerId !== null
            ? await storage.getUserBotProjects(ownerId)
            : [];

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Не удалось получить проекты" });
    }
}
