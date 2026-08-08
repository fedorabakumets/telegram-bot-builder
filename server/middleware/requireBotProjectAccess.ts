/**
 * @fileoverview Проверка доступа к проекту для `/api/bot/*` по botActorId.
 * @module middleware/requireBotProjectAccess
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storages/storage";
import { getBotActorId } from "./bot-api-actor";

/**
 * requireProjectAccess, но личность = req.botActorId (после resolveBotApiActor).
 * @param req - Express request
 * @param res - Express response
 * @param next - next middleware
 * @returns Promise<void>
 */
export async function requireBotProjectAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const projectId = parseInt(req.params.id ?? req.params.projectId, 10);
  if (isNaN(projectId)) {
    next();
    return;
  }

  const actorId = getBotActorId(req);
  if (actorId === null) {
    res.status(403).json({ message: "Нет прав доступа к проекту" });
    return;
  }

  const hasAccess = await storage.hasProjectAccess(projectId, actorId);
  if (!hasAccess) {
    res.status(403).json({ message: "Нет прав доступа к проекту" });
    return;
  }

  next();
}
