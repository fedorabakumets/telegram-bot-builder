/**
 * @fileoverview Маршруты настроек рантайма в /admin
 * @module server/admin/setup-runtime-settings-routes
 */

import type { Express } from "express";
import { requireAdminAuth } from "./admin-auth-middleware";
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
  app.get("/admin/api/runtime-settings/:group", requireAdminAuth, handleGetRuntimeSettings);
  app.put("/admin/api/runtime-settings/:group", requireAdminAuth, handlePutRuntimeSettings);
  app.post("/admin/api/runtime-settings/backups/run", requireAdminAuth, handleRunRuntimeBackup);
  app.post("/admin/api/runtime-settings/backups/telegram/test", requireAdminAuth, handleTestBackupTelegram);
  setupRuntimeGuideRoutes(app);
}
