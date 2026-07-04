/**
 * @fileoverview Middleware проверки admin-cookie для /admin/*
 * @module server/admin/admin-auth-middleware
 */

import type { NextFunction, Request, Response } from "express";
import { getAdminTokenFromRequest, verifyAdminToken } from "./admin-session";
import { resolveAdminApiKey } from "./resolve-admin-key";

/**
 * Проверяет, авторизован ли запрос как администратор платформы.
 * @param req - Запрос Express
 * @returns true, если admin-cookie валидна
 */
export function isAdminAuthenticated(req: Request): boolean {
  const key = resolveAdminApiKey();
  if (!key) return false;
  const token = getAdminTokenFromRequest(req);
  if (!token) return false;
  return verifyAdminToken(token, key);
}

/**
 * Требует валидную admin-сессию. Для HTML — редирект на /admin/login.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @param next - Следующий middleware
 * @returns void
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  if (isAdminAuthenticated(req)) {
    next();
    return;
  }

  const acceptsHtml = req.headers.accept?.includes("text/html");
  if (acceptsHtml || req.path === "/admin" || req.path.startsWith("/admin/docs") || req.path.startsWith("/admin/schema") || req.path.startsWith("/admin/api-docs")) {
    res.redirect(302, "/admin/login");
    return;
  }

  res.status(401).json({ error: "ADMIN_UNAUTHORIZED" });
}
