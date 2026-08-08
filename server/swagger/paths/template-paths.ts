/**
 * @fileoverview OpenAPI paths для библиотеки сценариев `/api/templates`.
 * @module server/swagger/paths/template-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerTemplateDeletePaths } from "./template-delete-paths";
import { registerTemplateFeaturedCategoryPaths } from "./template-featured-category-paths";
import { registerTemplateGetPutPaths } from "./template-get-put-paths";
import { registerTemplateListCreatePaths } from "./template-list-create-paths";
import { registerTemplateSearchPaths } from "./template-search-paths";
import { registerTemplateSeedPaths } from "./template-seed-paths";
import { registerTemplateUsePaths } from "./template-use-paths";
import { registerAdminTemplateFeaturedPaths } from "./template-admin-featured-paths";

/**
 * Регистрирует OpenAPI paths тега templates (+ admin featured/seed).
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
  registerAdminTemplateFeaturedPaths(registry);
  registerTemplateGetPutPaths(registry, cookieSecurity);
  registerTemplateDeletePaths(registry, cookieSecurity);
  registerTemplateUsePaths(registry, cookieSecurity);
}
