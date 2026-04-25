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
 * Пути, которые всегда пропускаются вне зависимости от статуса настройки.
 * Позволяют клиенту получить конфиг, выполнить setup и проверить здоровье сервиса.
 */
const EXCLUDED_PATHS = [
  "/api/setup/status",
  "/api/setup",
  "/api/config",
  "/api/health",
  "/api",
];

/**
 * Проверяет, исключён ли путь из проверки настройки.
 *
 * @param path - Путь запроса (req.path)
 * @returns `true` если путь исключён и должен быть пропущен
 */
function isExcluded(path: string): boolean {
  return EXCLUDED_PATHS.includes(path) || path.startsWith("/api/auth/");
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
