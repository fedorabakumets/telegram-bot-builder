/**
 * @fileoverview Middleware-резолвер личности по персональному токену агента (PAT)
 *
 * Дополняет identifyUser: если сессия не дала личность, читает токен из
 * `Authorization: Bearer <token>` (RFC 6750), резолвит его в владельца и ставит
 * req.user + req.agentScopes. Не блокирует запрос — при отсутствии/невалидности
 * токена запрос остаётся анонимным, а блокировку выполняет requireApiAuth.
 *
 * @module middleware/agentTokenMiddleware
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "../storages/storage";

/**
 * Извлекает Bearer-токен из заголовка Authorization.
 * @param req - Объект запроса Express
 * @returns Сырой токен или null, если заголовок отсутствует/не Bearer
 */
export function extractBearerToken(req: Request): string | null {
  const auth = req.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

/**
 * Резолвер персонального токена агента.
 * @param req - Объект запроса Express
 * @param _res - Объект ответа Express
 * @param next - Следующий middleware
 * @returns Promise<void>
 */
export async function identifyAgent(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.user) {
    next();
    return;
  }

  const raw = extractBearerToken(req);
  if (!raw) {
    next();
    return;
  }

  try {
    const resolved = await storage.resolveAgentTokenAuth(raw);
    if (resolved) {
      req.user = resolved.user;
      req.agentScopes = resolved.scopes;
    }
  } catch (error) {
    console.error("[identifyAgent] Ошибка резолва токена агента:", error);
  }

  next();
}
