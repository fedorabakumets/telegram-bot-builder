/**
 * @fileoverview Admin: выставить/снять featured у сценария.
 * @module server/admin/handlers/template-featured-handler
 */

import type { Request, Response } from "express";
import { z } from "zod";

import { storage } from "../../storages/storage";

/** Тело PATCH /admin/api/templates/:id/featured */
const FeaturedBodySchema = z.object({
  /** 1 — в избранном каталоге, 0 — убрать */
  featured: z.union([z.literal(0), z.literal(1)]),
});

/**
 * PATCH /admin/api/templates/:id/featured — только admin cookie.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function adminSetTemplateFeaturedHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ message: "Invalid template id" });
      return;
    }

    const parsed = FeaturedBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "featured must be 0 or 1" });
      return;
    }

    const existing = await storage.getBotTemplate(id);
    if (!existing) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    const updated = await storage.updateBotTemplate(id, {
      featured: parsed.data.featured,
    });
    if (!updated) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ Admin set template featured:", error);
    res.status(500).json({ message: "Failed to update featured" });
  }
}
