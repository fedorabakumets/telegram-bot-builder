/**
 * @fileoverview Модуль для настройки маршрутов аутентификации через Telegram
 *
 * Этот модуль предоставляет функцию для настройки маршрутов аутентификации,
 * позволяющие пользователям входить в систему с помощью аккаунта Telegram.
 *
 * @module setupAuthRoutes
 */

import type { Express } from "express";
import { handleLogin } from "./auth/handlers/loginHandler";
import { handleTelegramAuth } from "./auth/handlers/telegramAuthHandler";
import { handleGetUser } from "./auth/handlers/getUserHandler";
import { handleMiniAppAuth } from "./auth/handlers/miniAppAuthHandler";
import { handleDevLogin } from "./auth/handlers/devLoginHandler";
import { handlePublicConfig } from "./auth/handlers/configHandler";

/**
 * Настраивает маршруты аутентификации через Telegram
 *
 * @function setupAuthRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupAuthRoutes(app: Express): void {
    app.get("/api/auth/login", handleLogin);
    app.post("/api/auth/telegram", handleTelegramAuth);
    app.get("/api/auth/telegram/user/:id", handleGetUser);
    app.post("/api/auth/telegram/miniapp", handleMiniAppAuth);
    app.post("/api/auth/dev-login", handleDevLogin);
    app.get("/api/config", handlePublicConfig);
}
