/**
 * @fileoverview Агрегатор OpenAPI: PUT/DELETE строк.
 * @module server/swagger/paths/project-tables-rows-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProjectTablesRowsDeletePaths } from "./project-tables-rows-delete-paths";
import { registerProjectTablesRowsUpdatePaths } from "./project-tables-rows-update-paths";

/**
 * Регистрирует update/delete строк.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesRowsMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerProjectTablesRowsUpdatePaths(registry, cookieSecurity);
  registerProjectTablesRowsDeletePaths(registry, cookieSecurity);
}
