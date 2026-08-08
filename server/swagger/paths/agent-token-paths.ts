/**
 * @fileoverview Агрегатор OpenAPI paths тега agent-tokens.
 * @module server/swagger/paths/agent-token-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerAgentTokenListCreatePaths } from "./agent-token-list-create-paths";
import { registerAgentTokenRevokePaths } from "./agent-token-revoke-paths";

/**
 * Регистрирует детальные OpenAPI paths управления PAT.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement для session cookie / PAT
 * @returns void
 */
export function registerAgentTokenPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerAgentTokenListCreatePaths(registry, cookieSecurity);
  registerAgentTokenRevokePaths(registry, cookieSecurity);
}
