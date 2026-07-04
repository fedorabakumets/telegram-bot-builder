/**
 * @fileoverview Настройка CRUD-маршрутов реестра хранилищ `/api/storage-configs`.
 *
 * Регистрирует эндпоинты списка/создания/обновления/удаления конфигов хранилищ
 * и проверки их доступности (`/:id/test`). Глобальный `requireApiAuth` уже
 * защищает все `/api/*` (deny-by-default) — доп. middleware не требуется.
 * @module setupStorageConfigRoutes
 */

import type { Express } from "express";

import { listStorageConfigsHandler } from "./storageConfigs/handlers/listStorageConfigsHandler";
import { createStorageConfigHandler } from "./storageConfigs/handlers/createStorageConfigHandler";
import { updateStorageConfigHandler } from "./storageConfigs/handlers/updateStorageConfigHandler";
import { deleteStorageConfigHandler } from "./storageConfigs/handlers/deleteStorageConfigHandler";
import { testStorageConfigHandler } from "./storageConfigs/handlers/testStorageConfigHandler";

/**
 * Настраивает маршруты управления реестром хранилищ.
 * @param app - Экземпляр приложения Express
 * @returns {void}
 */
export function setupStorageConfigRoutes(app: Express): void {
  app.get("/api/storage-configs", listStorageConfigsHandler);
  app.post("/api/storage-configs", createStorageConfigHandler);
  app.patch("/api/storage-configs/:id", updateStorageConfigHandler);
  app.delete("/api/storage-configs/:id", deleteStorageConfigHandler);
  app.post("/api/storage-configs/:id/test", testStorageConfigHandler);
}
