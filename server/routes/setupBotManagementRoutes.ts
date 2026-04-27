/**
 * @fileoverview Модуль для настройки маршрутов управления ботами
 *
 * Этот модуль предоставляет функцию для настройки маршрутов управления
 * жизненным циклом ботов: запуск, остановка, перезапуск и проверка статуса.
 *
 * @module setupBotManagementRoutes
 */

import type { Express } from 'express';
import { requireProjectAccess } from '../middleware/requireProjectAccess';
import { handleBotStart } from './botManagement/handlers/botStartHandler';
import { handleBotStop } from './botManagement/handlers/botStopHandler';
import { handleBotRestart } from './botManagement/handlers/botRestartHandler';
import { handleBotRestartAll } from './botManagement/handlers/botRestartAllHandler';
import { handleBotStatusByToken } from './botManagement/handlers/botStatusByTokenHandler';
import { getBotTokenStatusHandler } from './botManagement/handlers/getBotTokenStatusHandler';
import { getBotTokenPhotoHandler } from './botManagement/handlers/getBotTokenPhotoHandler';
import { handleGetLaunchHistory } from './botManagement/handlers/botLaunchHistoryHandler';
import { handleGetLaunchLogs } from './botManagement/handlers/botLaunchLogsHandler';

/**
 * Настраивает маршруты управления ботами
 *
 * @function setupBotManagementRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupBotManagementRoutes(app: Express): void {
    app.get("/api/tokens/:tokenId/bot-status", handleBotStatusByToken);
    app.get("/api/bot/tokens/:tokenId/status", getBotTokenStatusHandler);
    app.get("/api/bot/tokens/:tokenId/photo", getBotTokenPhotoHandler);
    app.get("/api/tokens/:tokenId/launch-history", handleGetLaunchHistory);
    app.get("/api/launch/:launchId/logs", handleGetLaunchLogs);
    app.post("/api/projects/:id/bot/start", requireProjectAccess, handleBotStart);
    app.post("/api/projects/:id/bot/stop", requireProjectAccess, handleBotStop);
    app.post("/api/projects/:id/bot/restart", requireProjectAccess, handleBotRestart);
    app.post("/api/projects/:id/bot/restart-all", requireProjectAccess, handleBotRestartAll);
}
