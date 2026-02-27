/**
 * @fileoverview Модуль для настройки маршрутов управления проектами
 *
 * Этот модуль предоставляет функцию для настройки маршрутов, позволяющие управлять
 * проектами ботов, включая создание, обновление, удаление и экспорт проектов.
 *
 * @module setupProjectRoutes
 */

import type { Express } from "express";
import { setupBotManagementRoutes } from "./setupBotManagementRoutes";
import { setupDeleteProjectRoute } from "./setupDeleteProjectRoute";
import { listProjectsHandler } from "./projectRoutes/handlers/listProjectsHandler";
import { getAllProjectsHandler } from "./projectRoutes/handlers/getAllProjectsHandler";
import { getProjectHandler } from "./projectRoutes/handlers/getProjectHandler";
import { createProjectHandler } from "./projectRoutes/handlers/createProjectHandler";
import { updateProjectHandler } from "./projectRoutes/handlers/updateProjectHandler";
import { exportProjectHandler } from "./projectRoutes/handlers/exportProjectHandler";
import { getTokenHandler, clearTokenHandler } from "./projectRoutes/handlers/tokenHandlers";
import { updateCommentsSettingsHandler } from "./projectRoutes/handlers/settingsHandler";
import { exportToGoogleSheetsHandler, exportStructureToGoogleSheetsHandler } from "./projectRoutes/handlers/googleSheetsHandlers";

/**
 * Настраивает маршруты управления проектами
 *
 * @function setupProjectRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @param {Function} requireDbReady - Middleware для проверки готовности базы данных
 * @returns {void}
 */
export function setupProjectRoutes(app: Express, requireDbReady: (_req: any, res: any, next: any) => any): void {
    // Маршруты проектов
    app.get("/api/projects/list", requireDbReady, listProjectsHandler);
    app.get("/api/projects", requireDbReady, getAllProjectsHandler);
    app.get("/api/projects/:id", requireDbReady, getProjectHandler);
    app.post("/api/projects", requireDbReady, createProjectHandler);
    app.put("/api/projects/:id", requireDbReady, updateProjectHandler);

    // Удаление проекта
    setupDeleteProjectRoute(app, requireDbReady);

    // Экспорт проекта в Python
    app.post("/api/projects/:id/export", exportProjectHandler);

    // Управление токеном
    app.get("/api/projects/:id/token", getTokenHandler);
    app.delete("/api/projects/:id/token", clearTokenHandler);

    // Настройки генерации комментариев
    app.post("/api/settings/comments-generation", updateCommentsSettingsHandler);

    // Экспорт в Google Таблицы
    app.post("/api/projects/:id/export-to-google-sheets", requireDbReady, exportToGoogleSheetsHandler);
    app.post("/api/projects/:id/export-structure-to-google-sheets", requireDbReady, exportStructureToGoogleSheetsHandler);

    // Управление ботом
    setupBotManagementRoutes(app);
}
