/**
 * @fileoverview Агрегатор OpenAPI paths тега bot (`/api/bot/*`).
 * @module server/swagger/paths/bot-api-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerBotApiProjectsListPaths } from "./bot-api-projects-list-paths";
import { registerBotApiProjectCrudPaths } from "./bot-api-project-crud-paths";
import { registerBotApiProjectIoPaths } from "./bot-api-project-io-paths";
import { registerBotApiProjectTokensPaths } from "./bot-api-project-tokens-paths";
import { registerBotApiCollaboratorsPaths } from "./bot-api-collaborators-paths";
import { registerBotApiTokenInfoPaths } from "./bot-api-token-info-paths";
import { registerBotApiTokenUsersPaths } from "./bot-api-token-users-paths";
import { registerBotApiTokenEnvPaths } from "./bot-api-token-env-paths";
import { registerBotApiEnvIdPaths } from "./bot-api-env-id-paths";

/**
 * Регистрирует все documented paths тега bot (reveal — отдельно).
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerBotApiProjectsListPaths(registry, cookieSecurity);
  registerBotApiProjectCrudPaths(registry, cookieSecurity);
  registerBotApiProjectIoPaths(registry, cookieSecurity);
  registerBotApiProjectTokensPaths(registry, cookieSecurity);
  registerBotApiCollaboratorsPaths(registry, cookieSecurity);
  registerBotApiTokenInfoPaths(registry, cookieSecurity);
  registerBotApiTokenUsersPaths(registry, cookieSecurity);
  registerBotApiTokenEnvPaths(registry, cookieSecurity);
  registerBotApiEnvIdPaths(registry, cookieSecurity);
}
