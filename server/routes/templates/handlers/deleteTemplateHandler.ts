/**
 * @fileoverview DELETE /api/templates/:id — только владелец.
 * @module server/routes/templates/handlers/deleteTemplateHandler
 */

import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import { assertOwnerId, parseTemplateId } from "../template-access";

/**
 * Удаляет свой шаблон; системные и чужие — 403.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function deleteTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;

    const existing = await storage.getBotTemplate(id);
    if (!existing) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    if (existing.ownerId !== ownerId) {
      res.status(403).json({ message: "You don't have permission to delete this template" });
      return;
    }

    const success = await storage.deleteBotTemplate(id);
    if (!success) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Ошибка удаления шаблона:", error);
    res.status(500).json({ message: "Failed to delete template" });
  }
}
