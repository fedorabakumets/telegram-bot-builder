/**
 * @fileoverview PUT /api/templates/:id — только владелец, без privileged fields.
 * @module server/routes/templates/handlers/updateTemplateHandler
 */

import type { Request, Response } from "express";
import { z } from "zod";

import { storage } from "../../../storages/storage";
import { assertOwnerId, parseTemplateId } from "../template-access";
import { updateBotTemplateBodySchema } from "../template-body-schemas";

/**
 * Обновляет свой шаблон; системные и чужие — 403.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function updateTemplateHandler(req: Request, res: Response): Promise<void> {
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
      res.status(403).json({ message: "You don't have permission to modify this template" });
      return;
    }

    const validated = updateBotTemplateBodySchema.parse(req.body);
    const template = await storage.updateBotTemplate(id, validated);
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid data", errors: error.errors });
      return;
    }
    console.error("Ошибка обновления шаблона:", error);
    res.status(500).json({ message: "Failed to update template" });
  }
}
