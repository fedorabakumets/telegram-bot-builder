/**
 * @fileoverview Адреса панели управления, которые отдаёт React-приложение
 * @module server/admin/admin-client-pages
 */

import type { NextFunction, Request, Response } from "express";
import { isAdminAuthenticated } from "./admin-auth-middleware";
import { ADMIN_DOCS_VIEWER_PAGES } from "./admin-docs-viewer-pages";

/** Адреса панели, которые рисует приложение в браузере */
export const ADMIN_CLIENT_PAGES = [
  "/admin",
  "/admin/settings",
  "/admin/node-types",
  "/admin/maintenance",
  "/admin/docs",
  "/admin/schema",
  "/admin/api-docs",
  "/admin/health",
  "/admin/openapi",
  "/admin/live-db",
  "/admin/users",
  ...ADMIN_DOCS_VIEWER_PAGES,
] as const;

/**
 * Проверяет доступ и пропускает запрос к SPA, если пользователь авторизован.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @param next - Следующий обработчик
 */
export function passAdminPageToClient(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAdminAuthenticated(req)) {
    res.redirect(302, "/admin/login");
    return;
  }
  next();
}
