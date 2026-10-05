/**
 * @fileoverview Куда вести после входа в админку
 * @module server/admin/admin-login-redirect
 */

import type { Request, Response } from "express";
import { isConfigured } from "../services/app-settings.service";

/**
 * Редирект после успешного admin login: settings если не настроено, иначе hub.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function redirectAfterAdminLogin(req: Request, res: Response): Promise<void> {
  const configured = await isConfigured();
  if (!configured) {
    res.redirect(302, "/admin/settings");
    return;
  }
  res.redirect(302, "/admin");
}
