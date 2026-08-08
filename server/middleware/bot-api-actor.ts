/**
 * @fileoverview Actor для `/api/bot/*`: session/PAT vs scope bot_manager.
 *
 * Личный доступ: действующий id = req.user.id; query telegram_id обязан совпасть.
 * Scope `bot_manager` на PAT: можно действовать от любого telegram_id (bot-manager).
 *
 * @module middleware/bot-api-actor
 */

import type { Request, Response, NextFunction } from "express";
import { getOwnerIdFromRequest } from "../telegram/auth-middleware";

/** Scope PAT, разрешающий impersonation через telegram_id */
export const BOT_MANAGER_SCOPE = "bot_manager";

/**
 * Проверяет, есть ли у запроса scope bot_manager (из PAT).
 * @param req - Express request
 * @returns true, если impersonation разрешён
 */
export function hasBotManagerScope(req: Request): boolean {
  const scopes = req.agentScopes ?? "";
  return scopes
    .split(",")
    .map((s) => s.trim())
    .includes(BOT_MANAGER_SCOPE);
}

/**
 * Возвращает id действующего пользователя для `/api/bot/*`.
 * @param req - Express request после resolveBotApiActor
 * @returns telegram id актора или null
 */
export function getBotActorId(req: Request): number | null {
  return typeof req.botActorId === "number" ? req.botActorId : null;
}

/**
 * Резолвит req.botActorId из сессии/PAT и query telegram_id.
 * @param req - Express request
 * @param res - Express response
 * @param next - next middleware
 * @returns void
 */
export function resolveBotApiActor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ownerId = getOwnerIdFromRequest(req);
  if (ownerId === null) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const rawQuery = req.query.telegram_id;
  const queryId =
    rawQuery === undefined || rawQuery === ""
      ? null
      : Number(rawQuery);

  if (queryId !== null && (isNaN(queryId) || queryId <= 0)) {
    res.status(400).json({ error: "Параметр telegram_id некорректен" });
    return;
  }

  if (hasBotManagerScope(req)) {
    if (queryId === null) {
      res.status(400).json({
        error: "Параметр telegram_id обязателен для токена bot_manager",
      });
      return;
    }
    req.botActorId = queryId;
    next();
    return;
  }

  if (queryId !== null && queryId !== ownerId) {
    res.status(403).json({
      error: "telegram_id не совпадает с авторизованным пользователем",
    });
    return;
  }

  req.botActorId = ownerId;
  next();
}
