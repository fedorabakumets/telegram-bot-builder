import { NextFunction, Request, Response } from "express";
import "express-session";
import { TelegramUserDB } from "@shared/schema";

// Расширяем типы Express для поддержки req.user и session
declare module "express-session" {
  interface SessionData {
    telegramUser?: TelegramUserDB;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: TelegramUserDB;
    }
  }
}

/**
 * Middleware для установки req.user из Telegram сессии
 * Если пользователь авторизован через Telegram, его данные будут доступны в req.user
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.session?.telegramUser) {
    req.user = req.session.telegramUser;
  }
  next();
}

/**
 * Middleware для проверки авторизации
 * Возвращает 401, если пользователь не авторизован
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Требуется авторизация через Telegram"
    });
  }

  next();
  return; // Явно указываем, что функция завершается
}

/**
 * Опциональный middleware для получения ownerId
 * Возвращает ownerId из req.user или null для неавторизованных пользователей
 */
export function getOwnerIdFromRequest(req: Request): number | null {
  if (req.user) {
    return req.user.id;
  }
  return null;
}

/**
 * Возвращает ID сессии для неавторизованных пользователей
 * @param req - Объект запроса Express
 * @returns ID сессии или null если пользователь авторизован
 */
export function getSessionIdFromRequest(req: Request): string | null {
  if (req.user) return null; // авторизованный — sessionId не нужен
  return req.session?.id ?? null;
}
