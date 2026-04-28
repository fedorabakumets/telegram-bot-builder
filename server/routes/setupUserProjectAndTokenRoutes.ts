/**
 * @fileoverview Модуль для настройки маршрутов управления проектами и токенами пользователя
 *
 * Этот модуль предоставляет функцию для настройки маршрутов, позволяющие пользователям
 * управлять своими проектами и токенами ботов.
 *
 * @module setupUserProjectAndTokenRoutes
 */

import type { Express } from "express";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { getProjectsHandler } from "./userProjectsTokens/handlers/projects/getProjectsHandler";
import { getBotProjectsHandler } from "./userProjectsTokens/handlers/projects/getBotProjectsHandler";
import { getBotProjectDetailHandler } from "./userProjectsTokens/handlers/projects/getBotProjectDetailHandler";
import { exportBotProjectHandler } from "./userProjectsTokens/handlers/projects/exportBotProjectHandler";
import { createBotProjectHandler } from "./userProjectsTokens/handlers/projects/createBotProjectHandler";
import { importBotProjectHandler } from "./userProjectsTokens/handlers/projects/importBotProjectHandler";
import { importBotProjectDataHandler } from "./userProjectsTokens/handlers/projects/importBotProjectDataHandler";
import { updateBotProjectHandler } from "./userProjectsTokens/handlers/projects/updateBotProjectHandler";
import { deleteBotProjectHandler } from "./userProjectsTokens/handlers/projects/deleteBotProjectHandler";
import { createProjectHandler } from "./userProjectsTokens/handlers/projects/createProjectHandler";
import { updateProjectHandler } from "./userProjectsTokens/handlers/projects/updateProjectHandler";
import { deleteProjectHandler } from "./userProjectsTokens/handlers/projects/deleteProjectHandler";
import { getTokensHandler } from "./userProjectsTokens/handlers/tokens/getTokensHandler";
import { createTokenHandler } from "./userProjectsTokens/handlers/tokens/createTokenHandler";
import { updateTokenHandler } from "./userProjectsTokens/handlers/tokens/updateTokenHandler";
import { deleteTokenHandler } from "./userProjectsTokens/handlers/tokens/deleteTokenHandler";
import { getBotProjectTokensHandler } from "./userProjectsTokens/handlers/tokens/getBotProjectTokensHandler";
import { getBotTokenUsersHandler } from "./userProjectsTokens/handlers/users/getBotTokenUsersHandler";
import { getBotTokenUserHandler } from "./userProjectsTokens/handlers/users/getBotTokenUserHandler";
import { createBotTokenHandler } from "./userProjectsTokens/handlers/tokens/createBotTokenHandler";
import { deleteBotTokenHandler } from "./userProjectsTokens/handlers/tokens/deleteBotTokenHandler";
import { getTokenStatsHandler } from "./userProjectsTokens/handlers/tokens/getTokenStatsHandler";
import { getCollaboratorsHandler } from "./userProjectsTokens/handlers/collaborators/getCollaboratorsHandler";
import { addCollaboratorHandler } from "./userProjectsTokens/handlers/collaborators/addCollaboratorHandler";
import { removeCollaboratorHandler } from "./userProjectsTokens/handlers/collaborators/removeCollaboratorHandler";

/**
 * Настраивает маршруты управления проектами и токенами пользователя
 *
 * @function setupUserProjectAndTokenRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupUserProjectAndTokenRoutes(app: Express): void {
    app.get("/api/user/projects", getProjectsHandler);
    app.get("/api/bot/projects", getBotProjectsHandler);
    app.get("/api/bot/projects/:id", requireProjectAccess, getBotProjectDetailHandler);
    app.get("/api/bot/projects/:id/export", requireProjectAccess, exportBotProjectHandler);
    app.post("/api/bot/projects", createBotProjectHandler);
    app.post("/api/bot/projects/import", importBotProjectHandler);
    app.put("/api/bot/projects/:id/data", requireProjectAccess, importBotProjectDataHandler);
    app.patch("/api/bot/projects/:id", requireProjectAccess, updateBotProjectHandler);
    app.delete("/api/bot/projects/:id", requireProjectAccess, deleteBotProjectHandler);
    app.post("/api/user/projects", createProjectHandler);
    app.patch("/api/user/projects/:id", updateProjectHandler);
    app.delete("/api/user/projects/:id", deleteProjectHandler);

    app.get("/api/user/tokens", getTokensHandler);
    app.get("/api/bot/projects/:id/tokens", requireProjectAccess, getBotProjectTokensHandler);
    app.post("/api/bot/projects/:id/tokens", requireProjectAccess, createBotTokenHandler);
    app.delete("/api/bot/tokens/:tokenId", deleteBotTokenHandler);
    app.get("/api/bot/tokens/:tokenId/stats", getTokenStatsHandler);
    app.get("/api/bot/tokens/:tokenId/users", getBotTokenUsersHandler);
    app.get("/api/bot/tokens/:tokenId/users/:userId", getBotTokenUserHandler);
    app.post("/api/user/tokens", createTokenHandler);

    app.get("/api/bot/projects/:id/collaborators", requireProjectAccess, getCollaboratorsHandler);
    app.post("/api/bot/projects/:id/collaborators", requireProjectAccess, addCollaboratorHandler);
    app.delete("/api/bot/projects/:id/collaborators/:userId", requireProjectAccess, removeCollaboratorHandler);
    app.patch("/api/user/tokens/:id", updateTokenHandler);
    app.delete("/api/user/tokens/:id", deleteTokenHandler);
}
