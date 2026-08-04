import { Request, Response, NextFunction } from "express";
import { TelegramUserDB } from "@shared/schema";
import "express-session";

// Расширяем типы Express для поддержки req.user и session
declare module "express-session" {
  interface SessionData {
    telegramUser?: TelegramUserDB;
  }
}

declare global {
  namespace Express {
    interface Request {
      /** Пользователь из сессии или MCP PAT */
      user?: TelegramUserDB;
      /** Сырой Bearer PAT для remote MCP (только на /mcp) */
      mcpAgentToken?: string;
    }
  }
}

/**
 * Middleware для установки req.user из Telegram сессии
 * Если пользователь авторизован через Telegram, его данные будут доступны в req.user
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Проверяем наличие данных Telegram пользователя в сессии
  if (req.session?.telegramUser) {
    req.user = req.session.telegramUser;
    // console.log(`🔐 Auth middleware: User ${req.user.id} found in session`);
  } else {
    // console.log(`🔓 Auth middleware: No user in session`);
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
