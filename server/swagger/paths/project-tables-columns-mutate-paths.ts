/**
 * @fileoverview Агрегатор OpenAPI: PUT/DELETE колонок.
 * @module server/swagger/paths/project-tables-columns-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProjectTablesColumnsDeletePaths } from "./project-tables-columns-delete-paths";
import { registerProjectTablesColumnsRenamePaths } from "./project-tables-columns-rename-paths";

/**
 * Регистрирует rename/delete колонок.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesColumnsMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerProjectTablesColumnsRenamePaths(registry, cookieSecurity);
  registerProjectTablesColumnsDeletePaths(registry, cookieSecurity);
}
