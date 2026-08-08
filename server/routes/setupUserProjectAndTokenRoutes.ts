/**
 * @fileoverview Маршруты bot-facing API: проекты, токены, коллабораторы и env
 *
 * Auth: session cookie или Bearer PAT + resolveBotApiActor.
 * Scope `bot_manager` на PAT позволяет действовать от query telegram_id.
 *
 * @module setupUserProjectAndTokenRoutes
 */

import type { Express } from "express";
import { resolveBotApiActor } from "../middleware/bot-api-actor";
import { requireBotProjectAccess } from "../middleware/requireBotProjectAccess";
import { requireBotTokenOwnership } from "../middleware/requireResourceOwnership";
import { requireBotEnvVariableOwnership } from "../middleware/requireEnvVariableOwnership";
import { getBotProjectsHandler } from "./userProjectsTokens/handlers/projects/getBotProjectsHandler";
import { getBotProjectDetailHandler } from "./userProjectsTokens/handlers/projects/getBotProjectDetailHandler";
import { exportBotProjectHandler } from "./userProjectsTokens/handlers/projects/exportBotProjectHandler";
import { createBotProjectHandler } from "./userProjectsTokens/handlers/projects/createBotProjectHandler";
import { importBotProjectHandler } from "./userProjectsTokens/handlers/projects/importBotProjectHandler";
import { importBotProjectDataHandler } from "./userProjectsTokens/handlers/projects/importBotProjectDataHandler";
import { updateBotProjectHandler } from "./userProjectsTokens/handlers/projects/updateBotProjectHandler";
import { deleteBotProjectHandler } from "./userProjectsTokens/handlers/projects/deleteBotProjectHandler";
import { getBotProjectTokensHandler } from "./userProjectsTokens/handlers/tokens/getBotProjectTokensHandler";
import { getBotTokenUsersHandler } from "./userProjectsTokens/handlers/users/getBotTokenUsersHandler";
import { getBotTokenUserHandler } from "./userProjectsTokens/handlers/users/getBotTokenUserHandler";
import { createBotTokenHandler } from "./userProjectsTokens/handlers/tokens/createBotTokenHandler";
import { deleteBotTokenHandler } from "./userProjectsTokens/handlers/tokens/deleteBotTokenHandler";
import { getTokenStatsHandler } from "./userProjectsTokens/handlers/tokens/getTokenStatsHandler";
import { getCollaboratorsHandler } from "./userProjectsTokens/handlers/collaborators/getCollaboratorsHandler";
import { addCollaboratorHandler } from "./userProjectsTokens/handlers/collaborators/addCollaboratorHandler";
import { removeCollaboratorHandler } from "./userProjectsTokens/handlers/collaborators/removeCollaboratorHandler";
import { getEnvVariablesHandler } from "./userProjectsTokens/handlers/envVariables/getEnvVariablesHandler";
import { createEnvVariableHandler } from "./userProjectsTokens/handlers/envVariables/createEnvVariableHandler";
import { updateEnvVariableHandler } from "./userProjectsTokens/handlers/envVariables/updateEnvVariableHandler";
import { deleteEnvVariableHandler } from "./userProjectsTokens/handlers/envVariables/deleteEnvVariableHandler";
import { revealEnvVariableHandler } from "./userProjectsTokens/handlers/envVariables/revealEnvVariableHandler";

/**
 * Настраивает маршруты `/api/bot/*`.
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupUserProjectAndTokenRoutes(app: Express): void {
  const actor = resolveBotApiActor;

  app.get("/api/bot/projects", actor, getBotProjectsHandler);
  app.get("/api/bot/projects/:id", actor, requireBotProjectAccess, getBotProjectDetailHandler);
  app.get("/api/bot/projects/:id/export", actor, requireBotProjectAccess, exportBotProjectHandler);
  app.post("/api/bot/projects", actor, createBotProjectHandler);
  app.post("/api/bot/projects/import", actor, importBotProjectHandler);
  app.put("/api/bot/projects/:id/data", actor, requireBotProjectAccess, importBotProjectDataHandler);
  app.patch("/api/bot/projects/:id", actor, requireBotProjectAccess, updateBotProjectHandler);
  app.delete("/api/bot/projects/:id", actor, requireBotProjectAccess, deleteBotProjectHandler);

  app.get("/api/bot/projects/:id/tokens", actor, requireBotProjectAccess, getBotProjectTokensHandler);
  app.post("/api/bot/projects/:id/tokens", actor, requireBotProjectAccess, createBotTokenHandler);
  app.delete("/api/bot/tokens/:tokenId", actor, requireBotTokenOwnership, deleteBotTokenHandler);
  app.get("/api/bot/tokens/:tokenId/stats", actor, requireBotTokenOwnership, getTokenStatsHandler);
  app.get("/api/bot/tokens/:tokenId/users", actor, requireBotTokenOwnership, getBotTokenUsersHandler);
  app.get(
    "/api/bot/tokens/:tokenId/users/:userId",
    actor,
    requireBotTokenOwnership,
    getBotTokenUserHandler,
  );

  app.get(
    "/api/bot/projects/:id/collaborators",
    actor,
    requireBotProjectAccess,
    getCollaboratorsHandler,
  );
  app.post(
    "/api/bot/projects/:id/collaborators",
    actor,
    requireBotProjectAccess,
    addCollaboratorHandler,
  );
  app.delete(
    "/api/bot/projects/:id/collaborators/:userId",
    actor,
    requireBotProjectAccess,
    removeCollaboratorHandler,
  );

  app.get("/api/bot/tokens/:tokenId/env", actor, requireBotTokenOwnership, getEnvVariablesHandler);
  app.post("/api/bot/tokens/:tokenId/env", actor, requireBotTokenOwnership, createEnvVariableHandler);
  app.patch("/api/bot/env/:id", actor, requireBotEnvVariableOwnership, updateEnvVariableHandler);
  app.delete("/api/bot/env/:id", actor, requireBotEnvVariableOwnership, deleteEnvVariableHandler);
  app.get("/api/bot/env/:id/reveal", actor, requireBotEnvVariableOwnership, revealEnvVariableHandler);
}
