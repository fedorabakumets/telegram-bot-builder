/**
 * @fileoverview Агрегатор OpenAPI paths тега media.
 * @module server/swagger/paths/media-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerMediaListPaths } from "./media-list-paths";
import { registerMediaMutatePaths } from "./media-mutate-paths";
import { registerMediaUploadPaths } from "./media-upload-paths";
import { registerMediaUrlPaths } from "./media-url-paths";

/**
 * Регистрирует все media paths (13 операций).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerMediaPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerMediaListPaths(registry, cookieSecurity);
  registerMediaUploadPaths(registry, cookieSecurity);
  registerMediaUrlPaths(registry, cookieSecurity);
  registerMediaMutatePaths(registry, cookieSecurity);
}
