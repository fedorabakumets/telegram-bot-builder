/**
 * @fileoverview 404 JSON для несуществующих /api/* путей
 *
 * Подключается после всех API-роутов, но до Vite/static catch-all,
 * чтобы удалённые legacy endpoints не отдавали index.html (SPA).
 *
 * @module middleware/apiNotFoundHandler
 */

import type { Request, Response } from "express";

/**
 * Отвечает 404 JSON, если ни один API-handler не обработал запрос.
 * @param _req - Объект запроса Express
 * @param res - Объект ответа Express
 */
export function apiNotFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "API endpoint not found",
  });
}
