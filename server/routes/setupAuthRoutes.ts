/**
 * @fileoverview Модуль для настройки маршрутов аутентификации через Telegram
 *
 * Этот модуль предоставляет функцию для настройки маршрутов аутентификации,
 * позволяющие пользователям входить в систему с помощью аккаунта Telegram.
 *
 * @module setupAuthRoutes
 */

import type { Express, RequestHandler } from "express";
import { handleLogin } from "./auth/handlers/loginHandler";
import { handleTelegramAuth } from "./auth/handlers/telegramAuthHandler";
import { handleGetUser } from "./auth/handlers/getUserHandler";
import { handleMiniAppAuth } from "./auth/handlers/miniAppAuthHandler";
import { handleDevLogin } from "./auth/handlers/devLoginHandler";
import { handlePublicConfig } from "./auth/handlers/configHandler";
import { handleMe } from "./auth/handlers/meHandler";
import { handleLogout } from "./auth/handlers/logoutHandler";
import { authRateLimitMiddleware } from "./auth/utils/authRateLimit";
import { setupSetupRoutes } from "./setup";

/**
 * Rate limit только для mutating auth (login/logout), не для GET /me
 * @param handlers - Хендлеры маршрута
 * @returns Массив middleware + handlers
 */
function withAuthLimit(...handlers: RequestHandler[]): RequestHandler[] {
    return [authRateLimitMiddleware, ...handlers];
}

/**
 * Настраивает маршруты аутентификации через Telegram
 *
 * @param app - Экземпляр приложения Express
 */
export function setupAuthRoutes(app: Express): void {
    app.get("/api/auth/login", handleLogin);
    app.get("/api/auth/me", handleMe);
    app.post("/api/auth/logout", ...withAuthLimit(handleLogout));
    app.post("/api/auth/telegram/logout", ...withAuthLimit(handleLogout));
    app.post("/api/auth/telegram", ...withAuthLimit(handleTelegramAuth));
    app.get("/api/auth/telegram/user/:id", handleGetUser);
    app.post("/api/auth/telegram/miniapp", ...withAuthLimit(handleMiniAppAuth));
    app.post("/api/auth/dev-login", ...withAuthLimit(handleDevLogin));
    app.get("/api/config", handlePublicConfig);
    setupSetupRoutes(app);
}
