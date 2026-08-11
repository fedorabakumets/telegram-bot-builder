/**
 * @fileoverview GET /api/projects/:id/tokens/first — токен для codegen `.env`.
 * @module projectRoutes/handlers/getFirstProjectTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Отдаёт дефолтный (или единственный) токен проекта с сырым секретом и id.
 * Доступ уже проверен middleware `requireProjectAccess`.
 * @param req - Express request (`params.id` = projectId)
 * @param res - Express response
 * @returns Promise<void>
 */
export async function getFirstProjectTokenHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Некорректный projectId" });
      return;
    }

    const token = await storage.getDefaultBotToken(projectId);
    res.setHeader("Cache-Control", "no-store");

    if (!token) {
      res.json({ hasToken: false, id: null, token: null });
      return;
    }

    res.json({ hasToken: true, id: token.id, token: token.token });
  } catch (error) {
    console.error("[getFirstProjectTokenHandler]", error);
    res.status(500).json({ message: "Failed to fetch token" });
  }
}
