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
import { setupTablesRoutes } from "./tables/setupTablesRoutes";
import { listProjectsHandler } from "./projectRoutes/handlers/listProjectsHandler";
import { getAllProjectsHandler } from "./projectRoutes/handlers/getAllProjectsHandler";
import { getProjectHandler } from "./projectRoutes/handlers/getProjectHandler";
import { getProjectNodesHandler } from "./projectRoutes/handlers/getProjectNodesHandler";
import { getProjectNodeHandler } from "./projectRoutes/handlers/getProjectNodeHandler";
import { createProjectHandler } from "./projectRoutes/handlers/createProjectHandler";
import { updateProjectHandler } from "./projectRoutes/handlers/updateProjectHandler";
import { listProjectVersionsHandler } from "./projectRoutes/handlers/listProjectVersionsHandler";
import { restoreProjectVersionHandler } from "./projectRoutes/handlers/restoreProjectVersionHandler";
import { createProjectCommitHandler } from "./projectRoutes/handlers/createProjectCommitHandler";
import { getProjectVersionHandler } from "./projectRoutes/handlers/getProjectVersionHandler";
import { deleteProjectVersionHandler } from "./projectRoutes/handlers/deleteProjectVersionHandler";
import { pruneProjectVersionsHandler } from "./projectRoutes/handlers/pruneProjectVersionsHandler";
import { reorderProjectsHandler } from "./projectRoutes/handlers/reorderProjectsHandler";
import { exportProjectHandler } from "./projectRoutes/handlers/exportProjectHandler";
import { duplicateProjectHandler } from "./projectRoutes/handlers/duplicateProjectHandler";
import { getTokenHandler, clearTokenHandler } from "./projectRoutes/handlers/tokenHandlers";
import { listBotTokensHandler } from "./projectRoutes/handlers/listBotTokensHandler";
import { updateCommentsSettingsHandler } from "./projectRoutes/handlers/settingsHandler";
import { exportToGoogleSheetsHandler, exportStructureToGoogleSheetsHandler } from "./projectRoutes/handlers/googleSheetsHandlers";
import { uploadImageHandler } from "./projectManagement/handlers/uploadImageHandler";
import { cleanupOrphanedFoldersHandler } from "./projectManagement/handlers/cleanupOrphanedFoldersHandler";
import { handleGenerateCode } from "./projects/generateCode";
import { getAdminIdsHandler, updateAdminIdsHandler, removeAdminIdHandler } from "./projectRoutes/handlers/adminIdsHandler";
import { requireProjectAccess } from "../middleware/requireProjectAccess";

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
    app.get("/api/projects/:id", requireDbReady, requireProjectAccess, getProjectHandler);
    app.get("/api/projects/:projectId/nodes", requireDbReady, requireProjectAccess, getProjectNodesHandler);
    app.get("/api/projects/:projectId/nodes/:nodeId", requireDbReady, requireProjectAccess, getProjectNodeHandler);
    app.post("/api/projects", requireDbReady, createProjectHandler);
    app.put("/api/projects/reorder", requireDbReady, reorderProjectsHandler);
    app.put("/api/projects/:id", requireDbReady, requireProjectAccess, updateProjectHandler);

    // История версий проекта (снимки + откат)
    app.get("/api/projects/:id/versions", requireDbReady, requireProjectAccess, listProjectVersionsHandler);
    app.post("/api/projects/:id/versions/commit", requireDbReady, requireProjectAccess, createProjectCommitHandler);
    app.post("/api/projects/:id/versions/prune", requireDbReady, requireProjectAccess, pruneProjectVersionsHandler);
    app.get("/api/projects/:id/versions/:versionId", requireDbReady, requireProjectAccess, getProjectVersionHandler);
    app.post("/api/projects/:id/versions/:versionId/restore", requireDbReady, requireProjectAccess, restoreProjectVersionHandler);
    app.delete("/api/projects/:id/versions/:versionId", requireDbReady, requireProjectAccess, deleteProjectVersionHandler);

    // Удаление проекта
    setupDeleteProjectRoute(app, requireDbReady);

    // Экспорт проекта в Python
    app.post("/api/projects/:id/export", requireProjectAccess, exportProjectHandler);

    // Дублирование проекта (полная копия без токена)
    app.post("/api/projects/:id/duplicate", requireDbReady, requireProjectAccess, duplicateProjectHandler);

    // Генерация Python кода
    app.post("/api/projects/:id/generate", requireDbReady, requireProjectAccess, handleGenerateCode);

    // Управление токеном
    app.get("/api/projects/:id/token", requireProjectAccess, getTokenHandler);
    app.delete("/api/projects/:id/token", requireProjectAccess, clearTokenHandler);

    // Безопасный список токенов проекта (без секрета token) — для дискавери MCP-агентом
    app.get("/api/projects/:id/tokens/list", requireDbReady, requireProjectAccess, listBotTokensHandler);

    // Настройки генерации комментариев
    app.post("/api/settings/comments-generation", updateCommentsSettingsHandler);

    // Управление ID администраторов бота
    app.get("/api/projects/:id/admin-ids", requireProjectAccess, getAdminIdsHandler);
    app.put("/api/projects/:id/admin-ids", requireProjectAccess, updateAdminIdsHandler);
    app.post("/api/projects/:id/admin-ids/remove", requireProjectAccess, removeAdminIdHandler);

    // Экспорт в Google Таблицы
    app.post("/api/projects/:id/export-to-google-sheets", requireDbReady, requireProjectAccess, exportToGoogleSheetsHandler);
    app.post("/api/projects/:id/export-structure-to-google-sheets", requireDbReady, requireProjectAccess, exportStructureToGoogleSheetsHandler);

    // Загрузка изображений по URL
    app.post("/api/media/upload-from-url", requireDbReady, uploadImageHandler);

    // Очистка осиротевших папок ботов (без проекта в БД)
    app.post("/api/bot-folders/cleanup", requireDbReady, cleanupOrphanedFoldersHandler);

    // Управление ботом
    setupBotManagementRoutes(app);

    // Пользовательские таблицы проекта
    setupTablesRoutes(app, requireDbReady);
}
