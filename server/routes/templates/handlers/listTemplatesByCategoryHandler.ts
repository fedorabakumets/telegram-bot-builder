/**
 * @fileoverview GET /api/templates/category/:category — без guest ?ids= IDOR.
 * @module server/routes/templates/handlers/listTemplatesByCategoryHandler
 */

import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import { assertOwnerId } from "../template-access";

/**
 * Шаблоны по категории. custom — только свои; остальные — public + system.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function listTemplatesByCategoryHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    const { category } = req.params;

    if (category === "custom") {
      const templates = await storage.getUserBotTemplates(ownerId);
      res.json(templates.filter((t) => t.category === "custom"));
      return;
    }

    let templates = await storage.getTemplatesByCategory(category);
    templates = templates.filter((t) => t.isPublic === 1 || t.ownerId === null);
    res.json(templates);
  } catch (error) {
    console.error("Ошибка шаблонов по категории:", error);
    res.status(500).json({ message: "Failed to fetch templates by category" });
  }
}
