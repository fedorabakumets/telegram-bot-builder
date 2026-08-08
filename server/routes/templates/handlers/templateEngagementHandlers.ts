/**
 * @fileoverview Marketplace engagement: rate/like/bookmark/view/download.
 * UI не вызывает; оставлены под requireApiAuth (abuse-prone).
 * @module server/routes/templates/handlers/templateEngagementHandlers
 */

import type { Request, Response } from "express";

import { storage } from "../../../storages/storage";
import { parseTemplateId } from "../template-access";

/**
 * POST /api/templates/:id/rate — { rating: 1..5 }.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function rateTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }
    const success = await storage.rateTemplate(id, rating);
    if (!success) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json({ message: "Template rated successfully" });
  } catch (error) {
    console.error("Ошибка rating шаблона:", error);
    res.status(500).json({ message: "Failed to rate template" });
  }
}

/**
 * POST /api/templates/:id/view — инкремент просмотров.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function viewTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;
    const success = await storage.incrementTemplateViewCount(id);
    if (!success) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json({ message: "View count incremented" });
  } catch (error) {
    console.error("Ошибка view шаблона:", error);
    res.status(500).json({ message: "Failed to increment view count" });
  }
}

/**
 * POST /api/templates/:id/download — инкремент скачиваний.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function downloadTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;
    const success = await storage.incrementTemplateDownloadCount(id);
    if (!success) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json({ message: "Download count incremented" });
  } catch (error) {
    console.error("Ошибка download шаблона:", error);
    res.status(500).json({ message: "Failed to increment download count" });
  }
}

/**
 * POST /api/templates/:id/like — { liked: boolean }.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function likeTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;
    const { liked } = req.body;
    if (typeof liked !== "boolean") {
      res.status(400).json({ message: "liked must be a boolean" });
      return;
    }
    const success = await storage.toggleTemplateLike(id, liked);
    if (!success) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json({ message: liked ? "Template liked" : "Template unliked" });
  } catch (error) {
    console.error("Ошибка like шаблона:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
}

/**
 * POST /api/templates/:id/bookmark — { bookmarked: boolean }.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns Promise<void>
 */
export async function bookmarkTemplateHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = parseTemplateId(req.params.id, res);
    if (id === null) return;
    const { bookmarked } = req.body;
    if (typeof bookmarked !== "boolean") {
      res.status(400).json({ message: "bookmarked must be a boolean" });
      return;
    }
    const success = await storage.toggleTemplateBookmark(id, bookmarked);
    if (!success) {
      res.status(404).json({ message: "Template not found" });
      return;
    }
    res.json({ message: bookmarked ? "Template bookmarked" : "Template unbookmarked" });
  } catch (error) {
    console.error("Ошибка bookmark шаблона:", error);
    res.status(500).json({ message: "Failed to toggle bookmark" });
  }
}
