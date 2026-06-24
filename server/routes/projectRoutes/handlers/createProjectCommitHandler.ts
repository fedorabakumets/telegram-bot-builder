/**
 * @fileoverview Хендлер создания ручного коммита-чекпоинта проекта
 *
 * Создаёт именованную версию (kind='manual') из ТЕКУЩИХ данных проекта.
 * В отличие от авто-снимков, ручной коммит создаётся всегда (без дедупликации)
 * и не удаляется при очистке лишних авто-снимков. Проверка доступа выполняется
 * middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/createProjectCommitHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает запрос на создание ручного коммита-чекпоинта
 * @param req - Объект запроса (тело: { message: string })
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function createProjectCommitHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        if (isNaN(projectId) || !projectId) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
        if (!message) {
            res.status(400).json({ message: "Сообщение чекпоинта обязательно" });
            return;
        }

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        // Автор коммита — текущий авторизованный пользователь (или null для гостя)
        const authorId = getOwnerIdFromRequest(req);
        const version = await storage.createProjectVersion(
            projectId,
            project.data,
            message,
            authorId,
            "manual",
        );

        res.status(201).json(version);
    } catch (error) {
        console.error("Ошибка создания коммита проекта:", error);
        res.status(500).json({ message: "Не удалось создать чекпоинт", error: (error as Error).message });
    }
}
