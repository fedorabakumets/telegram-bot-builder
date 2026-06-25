/**
 * @fileoverview Настройка маршрутов управления персональными токенами агента (PAT)
 *
 * Регистрирует эндпоинты создания/списка/отзыва токенов агента для MCP.
 * Глобальный requireApiAuth уже защищает /api/* — доп. middleware не нужен.
 *
 * @module setupAgentTokenRoutes
 */

import type { Express } from "express";
import { listAgentTokensHandler } from "./agentTokens/handlers/listAgentTokensHandler";
import { createAgentTokenHandler } from "./agentTokens/handlers/createAgentTokenHandler";
import { revokeAgentTokenHandler } from "./agentTokens/handlers/revokeAgentTokenHandler";

/**
 * Настраивает маршруты управления персональными токенами агента.
 * @param app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupAgentTokenRoutes(app: Express): void {
  app.get("/api/agent-tokens", listAgentTokensHandler);
  app.post("/api/agent-tokens", createAgentTokenHandler);
  app.delete("/api/agent-tokens/:id", revokeAgentTokenHandler);
}
