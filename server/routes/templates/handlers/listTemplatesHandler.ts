/**
 * @fileoverview GET /api/templates — системные и публичные сценарии.
 * @module server/routes/templates/handlers/listTemplatesHandler
 */

import type { Request, Response } from "express";

import { assertOwnerId, canViewOrUseTemplate } from "../template-access";
import { storage } from "../../../storages/storage";

/**
 * Список системных (ownerId=null) и публичных (isPublic=1) шаблонов.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function listTemplatesHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;
    const allTemplates = await storage.getAllBotTemplates();
    const templates = allTemplates.filter((t) => canViewOrUseTemplate(t, ownerId));
    const mapped = templates.map((template) => ({
      ...template,
      flow_data: template.data,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Ошибка списка шаблонов:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
}
