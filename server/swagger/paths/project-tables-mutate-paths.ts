/**
 * @fileoverview Агрегатор OpenAPI: POST/PUT/DELETE таблиц.
 * @module server/swagger/paths/project-tables-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProjectTablesCreatePaths } from "./project-tables-create-paths";
import { registerProjectTablesDeletePaths } from "./project-tables-delete-paths";
import { registerProjectTablesRenamePaths } from "./project-tables-rename-paths";

/**
 * Регистрирует CRUD-мутации таблиц (create/rename/delete).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerProjectTablesCreatePaths(registry, cookieSecurity);
  registerProjectTablesRenamePaths(registry, cookieSecurity);
  registerProjectTablesDeletePaths(registry, cookieSecurity);
}
