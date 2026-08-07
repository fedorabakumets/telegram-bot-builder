/**
 * @fileoverview Регистрация роутов статуса первоначальной настройки
 * @module server/routes/setup
 */

import type { Express } from "express";
import {
  handleGetSetupBootstrap,
  handleGetSetupStatus,
} from "./setupHandlers";

/**
 * Регистрирует публичные роуты статуса setup (без сохранения настроек)
 * @param app - Экземпляр Express приложения
 */
export function setupSetupRoutes(app: Express): void {
  app.get("/api/setup/status", handleGetSetupStatus);
  app.get("/api/setup/bootstrap", handleGetSetupBootstrap);
}
