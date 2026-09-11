/**
 * @fileoverview Роуты /admin — вход по ключу и hub оператора
 * @module server/admin/setup-admin-routes
 */

import type { Express, Request, Response } from "express";
import express from "express";
import { isAdminAuthenticated, requireAdminAuth } from "./admin-auth-middleware";
import { clearAdminCookie, setAdminCookie } from "./admin-session";
import {
  handleGetAdminAppSettings,
  handlePutAdminAppSettings,
} from "./handlers/app-settings-handlers";
import {
  handleGetAdminDisabledNodeTypes,
  handlePutAdminDisabledNodeTypes,
} from "./handlers/disabled-node-types-handlers";
import { adminCleanupOrphanedBotFoldersHandler } from "./handlers/bot-folders-cleanup-handler";
import { adminSetTemplateFeaturedHandler } from "./handlers/template-featured-handler";
import {
  adminRecreateTemplatesHandler,
  adminRefreshTemplatesHandler,
} from "./handlers/template-seed-handlers";
import {
  handleGetAdminUpdateCheck,
  handleGetAdminVersion,
} from "./handlers/version-handlers";
import {
  handleGetAdminPlatformUser,
  handleGetAdminPlatformUsers,
} from "./handlers/platform-users-handlers";
import { ADMIN_CLIENT_PAGES, passAdminPageToClient } from "./admin-client-pages";
import {
  serveApiDocsEmbedIndex,
  serveApiDocsEmbedTag,
} from "./pages/api-docs-page";
import { serveAdminLoginPage } from "./pages/login-page";
import {
  serveSchemaDocsEmbedIndex,
  serveSchemaDocsEmbedTable,
} from "./pages/schema-docs-page";
import { isAdminEnabled, resolveAdminApiKey } from "./resolve-admin-key";
import { isConfigured } from "../services/app-settings.service";

/** Префикс защищённых admin-маршрутов */
export const ADMIN_PATHS_PREFIX = "/admin";

/**
 * Регистрирует /admin/login, API входа/выхода и hub.
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupAdminRoutes(app: Express): void {
  if (!isAdminEnabled()) return;

  app.get("/admin/login", (req, res) => {
    if (isAdminAuthenticated(req)) {
      redirectAfterAdminLogin(req, res);
      return;
    }
    serveAdminLoginPage(req, res);
  });

  app.use("/admin/api/login", express.urlencoded({ extended: false }));

  app.post("/admin/api/login", async (req, res) => {
    const key = resolveAdminApiKey();
    if (!key) {
      res.status(503).send("Admin не настроен");
      return;
    }

    const submitted = typeof req.body?.key === "string" ? req.body.key.trim() : "";
    if (!submitted || submitted !== key) {
      res.redirect(302, "/admin/login?error=1");
      return;
    }

    setAdminCookie(res, key);
    redirectAfterAdminLogin(req, res);
  });

  app.post("/admin/api/logout", (req, res) => {
    clearAdminCookie(res);
    res.redirect(302, "/admin/login");
  });

  app.get("/admin/api/status", (req, res) => {
    res.json({ authenticated: isAdminAuthenticated(req), adminEnabled: true });
  });

  app.get("/admin/api/version", requireAdminAuth, handleGetAdminVersion);
  app.get("/admin/api/update-check", requireAdminAuth, handleGetAdminUpdateCheck);

  app.get("/admin/api/users", requireAdminAuth, handleGetAdminPlatformUsers);
  app.get("/admin/api/users/:id", requireAdminAuth, handleGetAdminPlatformUser);

  app.get("/admin/api/app-settings", requireAdminAuth, handleGetAdminAppSettings);
  app.put("/admin/api/app-settings", requireAdminAuth, handlePutAdminAppSettings);

  app.get(
    "/admin/api/disabled-node-types",
    requireAdminAuth,
    handleGetAdminDisabledNodeTypes,
  );
  app.put(
    "/admin/api/disabled-node-types",
    requireAdminAuth,
    handlePutAdminDisabledNodeTypes,
  );

  app.post("/admin/api/templates/refresh", requireAdminAuth, adminRefreshTemplatesHandler);
  app.post("/admin/api/templates/recreate", requireAdminAuth, adminRecreateTemplatesHandler);
  app.patch(
    "/admin/api/templates/:id/featured",
    requireAdminAuth,
    adminSetTemplateFeaturedHandler,
  );
  app.post(
    "/admin/api/bot-folders/cleanup",
    requireAdminAuth,
    adminCleanupOrphanedBotFoldersHandler,
  );

  for (const pagePath of ADMIN_CLIENT_PAGES) {
    app.get(pagePath, passAdminPageToClient);
  }

  app.get("/admin/schema/embed", requireAdminAuth, serveSchemaDocsEmbedIndex);
  app.get("/admin/schema/embed/:tableName", requireAdminAuth, serveSchemaDocsEmbedTable);
  app.get("/admin/api-docs/embed", requireAdminAuth, serveApiDocsEmbedIndex);
  app.get("/admin/api-docs/embed/:slug", requireAdminAuth, serveApiDocsEmbedTag);

  app.get("/admin/schema/:tableName", passAdminPageToClient);
  app.get("/admin/api-docs/:slug", passAdminPageToClient);
  app.get("/admin/users/:id", passAdminPageToClient);
}

/**
 * Редирект после успешного admin login: settings если не настроено, иначе hub.
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
async function redirectAfterAdminLogin(req: Request, res: Response): Promise<void> {
  const configured = await isConfigured();
  if (!configured) {
    res.redirect(302, "/admin/settings");
    return;
  }
  res.redirect(302, "/admin");
}

/**
 * Middleware-обёртка для защиты произвольных маршрутов admin-зоной.
 * @returns Express middleware
 */
export function adminProtect(): typeof requireAdminAuth {
  return requireAdminAuth;
}
