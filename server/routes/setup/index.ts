/**
 * @fileoverview Регистрация роутов Setup Wizard
 * @module server/routes/setup
 */

import type { Express } from "express";
import { handleGetSetupStatus, handlePostSetup } from "./setupHandlers";

/**
 * Регистрирует роуты первоначальной настройки приложения
 * @param app - Экземпляр Express приложения
 */
export function setupSetupRoutes(app: Express): void {
  app.get("/api/setup/status", handleGetSetupStatus);
  app.post("/api/setup", handlePostSetup);
}
