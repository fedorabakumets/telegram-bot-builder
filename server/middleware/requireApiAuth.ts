/**
 * @fileoverview Глобальный deny-by-default middleware авторизации для /api
 *
 * По эталонной модели безопасности (api-security-ideal-architecture.md): все
 * `/api/*` закрыты по умолчанию, публичные роуты помечаются явным allowlist.
 * Подключается ПОСЛЕ identifyUser/identifyAgent — к этому моменту личность уже
 * установлена из сессии или токена агента. Нет личности и путь не публичный → 401.
 *
 * @module middleware/requireApiAuth
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Публичные префиксы (без /api — Express обрезает префикс при app.use("/api", ...)).
 * Согласованы с EXCLUDED_PATHS из setup-guard плюс auth/health/webhook.
 */
const PUBLIC_PREFIXES = [
  "/health",
  "/auth/",
  "/setup",
  "/config",
  "/webhook/",
  "/projects/import-from-files",
];

/**
 * Публичные пути точного совпадения (корень API — health-check).
 */
const PUBLIC_EXACT = ["", "/"];

/**
 * Проверяет, относится ли путь к публичному allowlist.
 * @param path - Путь запроса (req.path, без префикса /api)
 * @returns true, если путь публичный и не требует авторизации
 */
export function isPublicApiPath(path: string): boolean {
  if (PUBLIC_EXACT.includes(path)) return true;
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Глобальный requireAuth для /api с allowlist публичных роутов.
 * Публичные пути пропускаются; для остальных требуется req.user, иначе 401.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @param next - Следующий middleware
 * @returns void
 */
export function requireApiAuth(req: Request, res: Response, next: NextFunction): void {
  if (isPublicApiPath(req.path)) {
    next();
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  next();
}
