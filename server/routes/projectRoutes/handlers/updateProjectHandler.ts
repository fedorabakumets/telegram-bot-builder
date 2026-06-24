/**
 * @fileoverview Хендлер обновления проекта
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление проекта.
 * Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/updateProjectHandler
 */

import type { Request, Response } from "express";
import { insertBotProjectSchema } from "@shared/schema";
import { z } from "zod";
import { storage } from "../../../storages/storage";
import type { StorageBotProjectUpdate } from "../../../storages/storageTypes";
import { restartBotIfRunning } from "../../../bots/restartBotIfRunning";
import { syncContentToTable } from "../../../services/content-table";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

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

        const validatedData = insertBotProjectSchema
            .partial()
            .parse(req.body) as StorageBotProjectUpdate;

        // Необязательная заметка к версии. Берётся напрямую из тела запроса,
        // т.к. не является частью схемы данных проекта. Непустое значение
        // превращает снимок в постоянный ручной чекпоинт (kind='manual').
        const commitMessage = typeof req.body?.commitMessage === "string" ? req.body.commitMessage.trim() : "";

        const project = await storage.updateBotProject(projectId, validatedData);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        // Синхронизация контента в таблицу _content
        if (validatedData.data) {
            try {
                await syncContentToTable(projectId, validatedData.data);
                // Уведомляем бота о обновлении контента через Redis
                try {
                    const { getRedisPublisher } = await import("../../../redis/redisClient");
                    const pub = getRedisPublisher();
                    if (pub) {
                        await pub.publish(`bot:table_updated:${projectId}`, "reload");
                    }
                } catch {}
            } catch (err) {
                console.error(`[updateProjectHandler] Ошибка синхронизации _content для проекта ${projectId}:`, err);
            }

            // Создание снимка версии проекта (история + откат)
            try {
                if (commitMessage) {
                    // Ручной чекпоинт: создаётся всегда по явному намерению
                    // пользователя — без дедупликации и без очистки истории.
                    await storage.createProjectVersion(projectId, validatedData.data, commitMessage, getOwnerIdFromRequest(req), 'manual');
                } else {
                    // Авто-снимок: дедупликация + ограничение истории до 30 версий.
                    // Дедупликация: не создаём новый снимок, если самая свежая
                    // версия проекта идентична текущим данным (по JSON-представлению)
                    const latest = await storage.getLatestProjectVersion(projectId);
                    const isDuplicate = latest != null &&
                        JSON.stringify(latest.snapshot) === JSON.stringify(validatedData.data);
                    if (!isDuplicate) {
                        await storage.createProjectVersion(projectId, validatedData.data, project.name, project.ownerId ?? null, 'auto');
                        await storage.pruneProjectVersions(projectId, 30);
                    }
                }
            } catch (err) {
                console.error(`[updateProjectHandler] Ошибка создания снимка версии для проекта ${projectId}:`, err);
            }
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
