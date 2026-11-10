/**
 * @fileoverview Куда вести после входа в админку
 * @module server/admin/admin-login-redirect
 */

import type { Request, Response } from "express";
import { checkSetupAvailability } from "../middleware/check-setup-availability";

/**
 * Редирект после успешного admin login: settings если не настроено, иначе hub.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function redirectAfterAdminLogin(_req: Request, res: Response): Promise<void> {
  /** Не перенаправляет в первоначальную настройку при временном отказе хранилища. */
  const configured = await checkSetupAvailability(res, "adminLoginRedirect");
  if (configured === undefined) return;
  if (!configured) {
    res.redirect(302, "/admin/settings");
    return;
  }
  res.redirect(302, "/admin");
}
