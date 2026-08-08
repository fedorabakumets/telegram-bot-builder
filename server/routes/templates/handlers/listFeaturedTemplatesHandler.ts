/**
 * @fileoverview GET /api/templates/featured — рекомендуемые сценарии.
 * @module server/routes/templates/handlers/listFeaturedTemplatesHandler
 */

import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import { assertOwnerId, canViewOrUseTemplate } from "../template-access";

/**
 * Список featured-шаблонов, видимых текущему пользователю.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function listFeaturedTemplatesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    let templates = await storage.getFeaturedTemplates();
    templates = templates.filter((t) => canViewOrUseTemplate(t, ownerId));
    res.json(templates);
  } catch (error) {
    console.error("Ошибка featured шаблонов:", error);
    res.status(500).json({ message: "Failed to fetch featured templates" });
  }
}
