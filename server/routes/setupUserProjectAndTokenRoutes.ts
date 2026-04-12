/**
 * @fileoverview Модуль для настройки маршрутов управления проектами и токенами пользователя
 *
 * Этот модуль предоставляет функцию для настройки маршрутов, позволяющие пользователям
 * управлять своими проектами и токенами ботов.
 *
 * @module setupUserProjectAndTokenRoutes
 */

import type { Express } from "express";
import { getProjectsHandler } from "./userProjectsTokens/handlers/projects/getProjectsHandler";
import { getBotProjectsHandler } from "./userProjectsTokens/handlers/projects/getBotProjectsHandler";
import { getBotProjectDetailHandler } from "./userProjectsTokens/handlers/projects/getBotProjectDetailHandler";
import { createBotProjectHandler } from "./userProjectsTokens/handlers/projects/createBotProjectHandler";
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
import { createBotTokenHandler } from "./userProjectsTokens/handlers/tokens/createBotTokenHandler";
import { deleteBotTokenHandler } from "./userProjectsTokens/handlers/tokens/deleteBotTokenHandler";

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
    app.get("/api/bot/projects/:id", getBotProjectDetailHandler);
    app.post("/api/bot/projects", createBotProjectHandler);
    app.patch("/api/bot/projects/:id", updateBotProjectHandler);
    app.delete("/api/bot/projects/:id", deleteBotProjectHandler);
    app.post("/api/user/projects", createProjectHandler);
    app.patch("/api/user/projects/:id", updateProjectHandler);
    app.delete("/api/user/projects/:id", deleteProjectHandler);

    app.get("/api/user/tokens", getTokensHandler);
    app.get("/api/bot/projects/:id/tokens", getBotProjectTokensHandler);
    app.post("/api/bot/projects/:id/tokens", createBotTokenHandler);
    app.delete("/api/bot/tokens/:tokenId", deleteBotTokenHandler);
    app.post("/api/user/tokens", createTokenHandler);
    app.patch("/api/user/tokens/:id", updateTokenHandler);
    app.delete("/api/user/tokens/:id", deleteTokenHandler);
}
