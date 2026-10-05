/**
 * @fileoverview Маршруты просмотра документов разделов рантайма
 * @module server/admin/setup-runtime-guide-routes
 */

import type { Express } from "express";
import { passAdminPageToClient } from "./admin-client-pages";
import { requireAdminAuth } from "./admin-auth-middleware";
import { serveRuntimeGuideEmbed } from "./pages/guide-docs-page";

/**
 * Регистрирует HTML документа и оболочку React
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupRuntimeGuideRoutes(app: Express): void {
  app.get("/admin/guides/embed/:slug", requireAdminAuth, serveRuntimeGuideEmbed);
  app.get("/admin/guides/:slug", passAdminPageToClient);
}
