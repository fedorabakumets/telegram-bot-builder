/**
 * @fileoverview Модуль для настройки маршрутов управления ботами
 *
 * Этот модуль предоставляет функцию для настройки маршрутов управления
 * жизненным циклом ботов: запуск, остановка, перезапуск и проверка статуса.
 *
 * @module setupBotManagementRoutes
 */

import type { Express } from 'express';
import { handleBotStatus } from './botManagement/handlers/botStatusHandler';
import { handleBotStart } from './botManagement/handlers/botStartHandler';
import { handleBotStop } from './botManagement/handlers/botStopHandler';
import { handleBotRestart } from './botManagement/handlers/botRestartHandler';
import { handleBotStatusByToken } from './botManagement/handlers/botStatusByTokenHandler';

/**
 * Настраивает маршруты управления ботами
 *
 * @function setupBotManagementRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupBotManagementRoutes(app: Express): void {
    app.get("/api/projects/:id/bot", handleBotStatus);
    app.get("/api/tokens/:tokenId/bot-status", handleBotStatusByToken);
    app.post("/api/projects/:id/bot/start", handleBotStart);
    app.post("/api/projects/:id/bot/stop", handleBotStop);
    app.post("/api/projects/:id/bot/restart", handleBotRestart);
}
