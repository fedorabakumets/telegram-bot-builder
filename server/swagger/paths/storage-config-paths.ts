/**
 * @fileoverview OpenAPI paths для реестра внешних хранилищ `/api/storage-configs`.
 * @module server/swagger/paths/storage-config-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerStorageConfigDeleteTestPaths } from "./storage-config-delete-test-paths";
import { registerStorageConfigListCreatePaths } from "./storage-config-list-create-paths";
import { registerStorageConfigPatchPaths } from "./storage-config-patch-paths";

/**
 * Регистрирует все OpenAPI paths CRUD + test реестра storage-configs.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement (cookie / PAT)
 * @returns void
 */
export function registerStorageConfigPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerStorageConfigListCreatePaths(registry, cookieSecurity);
  registerStorageConfigPatchPaths(registry, cookieSecurity);
  registerStorageConfigDeleteTestPaths(registry, cookieSecurity);
}
