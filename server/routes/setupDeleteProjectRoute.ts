/**
 * @fileoverview Модуль для настройки маршрута удаления проекта
 *
 * Этот модуль предоставляет функцию для настройки маршрута удаления проекта,
 * включающую проверку прав доступа, остановку бота и удаление всех связанных данных.
 *
 * @module setupDeleteProjectRoute
 */

import type { Express } from "express";
import { getOwnerIdFromRequest } from "../telegram/auth-middleware";
import { canDeleteProject } from "./projectManagement/utils/permissionChecker";
import { deleteProject } from "./projectManagement/utils/projectDeleter";
import { storage } from "../storages/storage";

/**
 * Настраивает маршрут удаления проекта
 *
 * @function setupDeleteProjectRoute
 * @param {Express} app - Экземпляр приложения Express
 * @param {Function} requireDbReady - Middleware для проверки готовности базы данных
 * @returns {void}
 */
export function setupDeleteProjectRoute(app: Express, requireDbReady: (_req: any, res: any, next: any) => any) {
    app.delete("/api/projects/:id", requireDbReady, async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            console.log(`🗑️ Начинаем удаление проекта ${id}`);

            const project = await storage.getBotProject(id);
            if (!project) {
                console.log(`❌ Проект ${id} не найден`);
                return res.status(404).json({ message: "Проект не найден" });
            }
            console.log(`✅ Проект ${id} найден: ${project.name}`);

            const ownerId = getOwnerIdFromRequest(req);
            if (!canDeleteProject(project.ownerId, ownerId)) {
                console.log(`❌ Пользователь ${ownerId} не имеет прав на удаление проекта ${id}`);
                return res.status(403).json({ message: "Нет прав на удаление проекта" });
            }

            const result = await deleteProject(id);

            if (!result.success) {
                return res.status(500).json({ message: result.message });
            }

            console.log(`🎉 Проект ${id} успешно удален`);
            return res.json({ message: result.message });
        } catch (error) {
            console.error("❌ Критическая ошибка удаления проекта:", error);
            return res.status(500).json({
                message: "Не удалось удалить проект",
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
}
