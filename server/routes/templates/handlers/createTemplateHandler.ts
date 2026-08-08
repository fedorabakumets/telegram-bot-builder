/**
 * @fileoverview POST /api/templates — создание без featured/счётчиков.
 * @module server/routes/templates/handlers/createTemplateHandler
 */

import type { Request, Response } from "express";
import { z } from "zod";

import { storage } from "../../../storages/storage";
import { assertOwnerId } from "../template-access";
import { createBotTemplateBodySchema } from "../template-body-schemas";

/**
 * Создаёт сценарий с ownerId из сессии; featured всегда 0.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function createTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = assertOwnerId(req, res);
    if (ownerId === null) return;

    const validated = createBotTemplateBodySchema.parse(req.body);
    const template = await storage.createBotTemplate({
      ...validated,
      ownerId,
      isPublic: validated.isPublic ?? 0,
      featured: 0,
    });
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid data", errors: error.errors });
      return;
    }
    console.error("Ошибка создания шаблона:", error);
    res.status(500).json({ message: "Failed to create template" });
  }
}
