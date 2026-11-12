/**
 * @fileoverview Модуль для настройки маршрутов управления ботами
 *
 * Этот модуль предоставляет функцию для настройки маршрутов управления
 * жизненным циклом ботов: запуск, остановка, перезапуск и проверка статуса.
 *
 * @module setupBotManagementRoutes
 */

import type { Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireProjectAccess } from '../middleware/requireProjectAccess';
import { resolveBotApiActor } from '../middleware/bot-api-actor';
import { requireBotTokenOwnership, requireTokenOwnership } from '../middleware/requireResourceOwnership';
import { handleBotRuntimeSettings } from './botManagement/handlers/botRuntimeSettingsHandler';
import { handleBotStart } from './botManagement/handlers/botStartHandler';
import { handleBotStop } from './botManagement/handlers/botStopHandler';
import { handleBotRestart } from './botManagement/handlers/botRestartHandler';
import { handleBotRestartAll } from './botManagement/handlers/botRestartAllHandler';
import { handleBotStartOfflineAll } from './botManagement/handlers/botStartOfflineAllHandler';
import { handleBotProjectStatuses } from './botManagement/handlers/botProjectStatusesHandler';
import { handleBotStatusByToken } from './botManagement/handlers/botStatusByTokenHandler';
import { getBotTokenStatusHandler } from './botManagement/handlers/getBotTokenStatusHandler';
import { getBotTokenPhotoHandler } from './botManagement/handlers/getBotTokenPhotoHandler';
import { handleGetLaunchHistory } from './botManagement/handlers/botLaunchHistoryHandler';
import { handleGetLaunchLogs } from './botManagement/handlers/botLaunchLogsHandler';
import { handleWorkerStats } from './botManagement/handlers/workerStatsHandler';
import { handleClearLogs } from './botManagement/handlers/clearLogsHandler';
import { handleGetLiveBotLogs } from './botManagement/handlers/botLiveLogsHandler';
import { handleGetBotLogById } from './botManagement/handlers/botLogByIdHandler';

/**
 * Настраивает маршруты управления ботами
 *
 * @function setupBotManagementRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupBotManagementRoutes(app: Express): void {
    /** Квота чтения применяется до обращения к хранилищу при проверке владения. */
    const runtimeReadLimit = rateLimit({ windowMs: 60_000, limit: 120,
        standardHeaders: true, legacyHeaders: false,
        message: { message: 'Слишком много запросов настроек бота. Повторите позже.' } });
    /** Запись имеет отдельную квоту, чтобы опрос интерфейса не блокировал сохранение. */
    const runtimeWriteLimit = rateLimit({ windowMs: 60_000, limit: 20,
        standardHeaders: true, legacyHeaders: false,
        message: { message: 'Слишком частое изменение режима бота. Повторите позже.' } });
    /** Частый опрос статистики ограничивается до авторизации и чтения снимка исполнителя. */
    const workerStatsLimit = rateLimit({ windowMs: 60_000, limit: 120,
        standardHeaders: true, legacyHeaders: false,
        message: { message: 'Слишком много запросов статистики воркеров. Повторите позже.' } });
    /** Режим обработчика сохраняется отдельно от способа получения сообщений. */
    app.get('/api/projects/:projectId/tokens/:tokenId/runtime-settings', runtimeReadLimit,
        requireTokenOwnership, handleBotRuntimeSettings);
    app.put('/api/projects/:projectId/tokens/:tokenId/runtime-settings', runtimeWriteLimit,
        requireTokenOwnership, handleBotRuntimeSettings);
    app.get("/api/workers/stats", workerStatsLimit, handleWorkerStats);
    app.get("/api/tokens/:tokenId/bot-status", handleBotStatusByToken);
    app.get(
        "/api/bot/tokens/:tokenId/status",
        resolveBotApiActor,
        requireBotTokenOwnership,
        getBotTokenStatusHandler,
    );
    app.get(
        "/api/bot/tokens/:tokenId/photo",
        resolveBotApiActor,
        requireBotTokenOwnership,
        getBotTokenPhotoHandler,
    );
    app.get("/api/tokens/:tokenId/launch-history", handleGetLaunchHistory);
    app.get("/api/launch/:launchId/logs", handleGetLaunchLogs);
    app.get("/api/bot-logs/:logId", handleGetBotLogById);
    app.get("/api/projects/:projectId/tokens/:tokenId/logs", requireProjectAccess, handleGetLiveBotLogs);
    app.post("/api/projects/:id/bot/start", requireProjectAccess, handleBotStart);
    app.post("/api/projects/:id/bot/stop", requireProjectAccess, handleBotStop);
    app.post("/api/projects/:id/bot/restart", requireProjectAccess, handleBotRestart);
    app.post("/api/projects/:id/bot/restart-all", requireProjectAccess, handleBotRestartAll);
    app.post("/api/projects/:id/bot/start-offline-all", requireProjectAccess, handleBotStartOfflineAll);
    app.get("/api/projects/:id/bot/statuses", requireProjectAccess, handleBotProjectStatuses);
    app.delete("/api/projects/:projectId/tokens/:tokenId/logs", requireProjectAccess, handleClearLogs);
}
