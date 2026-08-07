/**
 * @fileoverview Хендлеры роутов статуса первоначальной настройки
 *
 * Публичные эндпоинты для проверки configured/adminEnabled.
 * Сохранение настроек — только через /admin/api/app-settings.
 *
 * @module server/routes/setup/setupHandlers
 */

import type { Request, Response } from "express";
import { isAdminEnabled } from "../../admin/resolve-admin-key";
import { isConfigured } from "../../services/app-settings.service";

/**
 * Возвращает статус настройки приложения
 *
 * GET /api/setup/status
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns `{ configured: boolean }` — всегда 200
 */
export async function handleGetSetupStatus(
  _req: Request,
  res: Response,
): Promise<void> {
  const configured = await isConfigured();
  res.json({ configured });
}

/**
 * Возвращает bootstrap-данные для клиента при first-run
 *
 * GET /api/setup/bootstrap
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns `{ configured, adminEnabled }` — всегда 200
 */
export async function handleGetSetupBootstrap(
  _req: Request,
  res: Response,
): Promise<void> {
  const configured = await isConfigured();
  res.json({
    configured,
    adminEnabled: isAdminEnabled(),
  });
}
