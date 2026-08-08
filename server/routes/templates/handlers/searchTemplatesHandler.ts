/**
 * @fileoverview GET /api/templates/search — поиск с privacy-фильтром.
 * @module server/routes/templates/handlers/searchTemplatesHandler
 */

import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import { assertOwnerId, canViewOrUseTemplate } from "../template-access";

/**
 * Поиск шаблонов, видимых текущему пользователю.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function searchTemplatesHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    const { q } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    let templates = await storage.searchTemplates(q);
    templates = templates.filter((t) => canViewOrUseTemplate(t, ownerId));
    res.json(templates);
  } catch (error) {
    console.error("Ошибка поиска шаблонов:", error);
    res.status(500).json({ message: "Failed to search templates" });
  }
}
