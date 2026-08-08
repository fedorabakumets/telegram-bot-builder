/**
 * @fileoverview OpenAPI paths для библиотеки сценариев `/api/templates`.
 * @module server/swagger/paths/template-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerTemplateDeletePaths } from "./template-delete-paths";
import { registerTemplateFeaturedCategoryPaths } from "./template-featured-category-paths";
import { registerTemplateGetPutPaths } from "./template-get-put-paths";
import { registerTemplateLikeBookmarkPaths } from "./template-like-bookmark-paths";
import { registerTemplateListCreatePaths } from "./template-list-create-paths";
import { registerTemplateRatePaths } from "./template-rate-paths";
import { registerTemplateSearchPaths } from "./template-search-paths";
import { registerTemplateSeedPaths } from "./template-seed-paths";
import { registerTemplateUsePaths } from "./template-use-paths";
import { registerTemplateViewDownloadPaths } from "./template-view-download-paths";

/**
 * Регистрирует все OpenAPI paths тега templates (16 операций).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement (cookie / PAT)
 * @returns void
 */
export function registerTemplatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerTemplateListCreatePaths(registry, cookieSecurity);
  registerTemplateFeaturedCategoryPaths(registry, cookieSecurity);
  registerTemplateSearchPaths(registry, cookieSecurity);
  registerTemplateSeedPaths(registry);
  registerTemplateGetPutPaths(registry, cookieSecurity);
  registerTemplateDeletePaths(registry, cookieSecurity);
  registerTemplateUsePaths(registry, cookieSecurity);
  registerTemplateRatePaths(registry, cookieSecurity);
  registerTemplateLikeBookmarkPaths(registry, cookieSecurity);
  registerTemplateViewDownloadPaths(registry, cookieSecurity);
}
