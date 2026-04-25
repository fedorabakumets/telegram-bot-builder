/**
 * @fileoverview Middleware защиты API до завершения первоначальной настройки
 *
 * Блокирует все `/api/*` запросы с кодом 503, если приложение ещё не настроено.
 * Ряд маршрутов исключён из проверки — они доступны всегда.
 *
 * @module middleware/setup-guard
 */

import type { Request, Response, NextFunction } from "express";
import { isConfigured } from "../services/app-settings.service";

/**
 * Пути (без префикса /api), которые всегда пропускаются.
 * При подключении через app.use("/api", ...) Express обрезает /api из req.path.
 */
const EXCLUDED_PATHS = [
  "/setup/status",
  "/setup",
  "/config",
  "/health",
  "/",
  "",
];

/**
 * Проверяет, исключён ли путь из проверки настройки.
 * Сравнивает с req.path (без префикса /api).
 *
 * @param path - Путь запроса (req.path, без /api)
 * @returns `true` если путь исключён и должен быть пропущен
 */
function isExcluded(path: string): boolean {
  return EXCLUDED_PATHS.includes(path) || path.startsWith("/auth/");
}

/**
 * Middleware проверки завершённости первоначальной настройки приложения.
 *
 * Если `isConfigured()` возвращает `false` и путь не исключён —
 * отвечает статусом 503 с телом `{ setupRequired: true, message }`.
 * В противном случае передаёт управление следующему middleware.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @param next - Следующий middleware
 * @returns Promise<void>
 */
export async function setupGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (isExcluded(req.path)) {
    next();
    return;
  }

  const configured = await isConfigured();
  if (configured) {
    next();
    return;
  }

  res.status(503).json({
    setupRequired: true,
    message: "Приложение не настроено. Перейдите на /setup",
  });
}
