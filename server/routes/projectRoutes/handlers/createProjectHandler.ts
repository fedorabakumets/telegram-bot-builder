/**
 * @fileoverview Хендлер создания проекта
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на создание нового проекта.
 *
 * @module projectRoutes/handlers/createProjectHandler
 */

import type { Request, Response } from "express";
import { insertBotProjectSchema } from "@shared/schema";
import { z } from "zod";
import { storage } from "../../../storages/storage";
import type { StorageBotProjectInput } from "../../../storages/storageTypes";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает запрос на создание проекта
 *
 * @function createProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function createProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const ownerId = getOwnerIdFromRequest(req);

        // Гостям создание проектов запрещено
        if (ownerId === null) {
            res.status(401).json({ message: "Требуется авторизация через Telegram" });
            return;
        }

        const { ownerId: _ignored, ...bodyData } = req.body;
        const validatedData = insertBotProjectSchema.parse(bodyData) as StorageBotProjectInput;

        const projectData: StorageBotProjectInput = {
            ...validatedData,
            ownerId,
            sessionId: null,
        };

        const project = await storage.createBotProject(projectData);
        res.status(201).json(project);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Неверные данные", errors: error.errors });
        } else {
            res.status(500).json({ message: "Не удалось создать проект" });
        }
    }
}
