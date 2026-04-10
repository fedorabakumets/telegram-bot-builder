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
import { getProjectNodesHandler } from "./projectRoutes/handlers/getProjectNodesHandler";
import { getProjectNodeHandler } from "./projectRoutes/handlers/getProjectNodeHandler";
import { createProjectHandler } from "./projectRoutes/handlers/createProjectHandler";
import { updateProjectHandler } from "./projectRoutes/handlers/updateProjectHandler";
import { reorderProjectsHandler } from "./projectRoutes/handlers/reorderProjectsHandler";
import { exportProjectHandler } from "./projectRoutes/handlers/exportProjectHandler";
import { getTokenHandler, clearTokenHandler } from "./projectRoutes/handlers/tokenHandlers";
import { updateCommentsSettingsHandler } from "./projectRoutes/handlers/settingsHandler";
import { exportToGoogleSheetsHandler, exportStructureToGoogleSheetsHandler } from "./projectRoutes/handlers/googleSheetsHandlers";
import { uploadImageHandler } from "./projectManagement/handlers/uploadImageHandler";
import { cleanupOrphanedFoldersHandler } from "./projectManagement/handlers/cleanupOrphanedFoldersHandler";
import { handleGenerateCode } from "./projects/generateCode";
import { getAdminIdsHandler, updateAdminIdsHandler } from "./projectRoutes/handlers/adminIdsHandler";

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
    app.get("/api/projects/:projectId/nodes", requireDbReady, getProjectNodesHandler);
    app.get("/api/projects/:projectId/nodes/:nodeId", requireDbReady, getProjectNodeHandler);
    app.post("/api/projects", requireDbReady, createProjectHandler);
    app.put("/api/projects/reorder", requireDbReady, reorderProjectsHandler);
    app.put("/api/projects/:id", requireDbReady, updateProjectHandler);

    // Удаление проекта
    setupDeleteProjectRoute(app, requireDbReady);

    // Экспорт проекта в Python
    app.post("/api/projects/:id/export", exportProjectHandler);

    // Генерация Python кода
    app.post("/api/projects/:id/generate", requireDbReady, handleGenerateCode);

    // Управление токеном
    app.get("/api/projects/:id/token", getTokenHandler);
    app.delete("/api/projects/:id/token", clearTokenHandler);

    // Настройки генерации комментариев
    app.post("/api/settings/comments-generation", updateCommentsSettingsHandler);

    // Управление ID администраторов бота
    app.get("/api/projects/:id/admin-ids", getAdminIdsHandler);
    app.put("/api/projects/:id/admin-ids", updateAdminIdsHandler);

    // Экспорт в Google Таблицы
    app.post("/api/projects/:id/export-to-google-sheets", requireDbReady, exportToGoogleSheetsHandler);
    app.post("/api/projects/:id/export-structure-to-google-sheets", requireDbReady, exportStructureToGoogleSheetsHandler);

    // Загрузка изображений по URL
    app.post("/api/media/upload-from-url", requireDbReady, uploadImageHandler);

    // Очистка осиротевших папок ботов (без проекта в БД)
    app.post("/api/bot-folders/cleanup", requireDbReady, cleanupOrphanedFoldersHandler);

    // Управление ботом
    setupBotManagementRoutes(app);
}
