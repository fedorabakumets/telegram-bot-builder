/**
 * @fileoverview Admin seed системных сценариев: refresh / recreate.
 * @module server/admin/handlers/template-seed-handlers
 */

import type { Request, Response } from "express";

import { seedDefaultTemplates } from "../../utils/seed-templates";

/**
 * POST /admin/api/templates/refresh — force seed системных шаблонов.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function adminRefreshTemplatesHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    console.log("🔄 Admin: принудительное обновление шаблонов");
    await seedDefaultTemplates(true);
    res.json({
      message: "Templates refreshed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Admin refresh templates:", error);
    res.status(500).json({ message: "Failed to refresh templates" });
  }
}

/**
 * POST /admin/api/templates/recreate — то же seed (force), отдельный путь для совместимости.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function adminRecreateTemplatesHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    console.log("🔄 Admin: пересоздание шаблонов (seed force)");
    await seedDefaultTemplates(true);
    res.json({
      message: "Templates recreated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Admin recreate templates:", error);
    res.status(500).json({ message: "Failed to recreate templates" });
  }
}
