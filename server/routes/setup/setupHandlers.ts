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
import { checkSetupAvailability } from "../../middleware/check-setup-availability";

/**
 * Возвращает статус настройки приложения
 *
 * GET /api/setup/status
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns Статус настройки либо временный отказ 503 при ошибке проверки
 */
export async function handleGetSetupStatus(
  _req: Request,
  res: Response,
): Promise<void> {
  const configured = await checkSetupAvailability(res, "setupStatus");
  if (configured === undefined) return;
  res.json({ configured });
}

/**
 * Возвращает bootstrap-данные для клиента при first-run
 *
 * GET /api/setup/bootstrap
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns Данные первоначальной настройки либо временный отказ 503
 */
export async function handleGetSetupBootstrap(
  _req: Request,
  res: Response,
): Promise<void> {
  const configured = await checkSetupAvailability(res, "setupBootstrap");
  if (configured === undefined) return;
  res.json({
    configured,
    adminEnabled: isAdminEnabled(),
  });
}
