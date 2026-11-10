/**
 * @fileoverview Маршруты настроек рантайма в /admin
 * @module server/admin/setup-runtime-settings-routes
 */

import { handleTestTelegramConnection } from "./telegram-connection-test";
import type { Express } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAdminAuth } from "./admin-auth-middleware";
import { getWorkerRuntimeStatus } from "./worker-runtime-status";
import { restartPendingWorkers } from "./restart-pending-workers";
import {
  handleGetRuntimeSettings,
  handlePutRuntimeSettings,
  handleRunRuntimeBackup,
} from "./runtime-settings-handlers";
import { setupRuntimeGuideRoutes } from "./setup-runtime-guide-routes";
import { handleTestBackupTelegram } from "./runtime-backup-telegram-handler";

/**
 * Регистрирует чтение и запись разделов и немедленный бэкап
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupRuntimeSettingsRoutes(app: Express): void {
  /** Ограничение опроса состояния воркеров одним клиентом. */
  const workerStatusLimit = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
  /** Защита от частых перезапусков через административный маршрут. */
  const workerRestartLimit = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
  app.get("/admin/api/runtime-settings/:group", requireAdminAuth, handleGetRuntimeSettings);
  /** Отдаёт администратору снимок работающих воркеров. */
  app.get("/admin/api/runtime-settings/workers/status", workerStatusLimit, requireAdminAuth, async (_req, res) => {
    try { res.json(await getWorkerRuntimeStatus()); }
    catch { res.status(500).json({ message: "Не удалось получить состояние воркеров" }); }
  });
  /** Перезапускает только ботов в воркерах прежней группировки. */
  app.post("/admin/api/runtime-settings/workers/restart-pending", workerRestartLimit, requireAdminAuth, async (_req, res) => {
    try { res.json(await restartPendingWorkers()); }
    catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : 'Не удалось перезапустить ботов' }); }
  });
  app.put("/admin/api/runtime-settings/:group", requireAdminAuth, handlePutRuntimeSettings);
  app.post("/admin/api/runtime-settings/platform/telegram/test", requireAdminAuth, handleTestTelegramConnection);
  app.post("/admin/api/runtime-settings/backups/run", requireAdminAuth, handleRunRuntimeBackup);
  app.post("/admin/api/runtime-settings/backups/telegram/test", requireAdminAuth, handleTestBackupTelegram);
  setupRuntimeGuideRoutes(app);
}
