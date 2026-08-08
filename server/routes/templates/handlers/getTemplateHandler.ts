/**
 * @fileoverview GET /api/templates/:id — доступ через canViewOrUseTemplate.
 * @module server/routes/templates/handlers/getTemplateHandler
 */

import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import { assertOwnerId, canViewOrUseTemplate, parseTemplateId } from "../template-access";

/**
 * Один шаблон: системный, публичный или свой; иначе 403.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function getTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;

    const template = await storage.getBotTemplate(id);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    if (!canViewOrUseTemplate(template, ownerId)) {
      res.status(403).json({ message: "You don't have permission to access this template" });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error("Ошибка получения шаблона:", error);
    res.status(500).json({ message: "Failed to fetch template" });
  }
}
