/**
 * @fileoverview Настройка CRUD-маршрутов реестра хранилищ `/api/storage-configs`.
 *
 * Регистрирует эндпоинты списка/создания/обновления/удаления конфигов хранилищ
 * и проверки их доступности (`/:id/test`). Список доступен авторизованным
 * пользователям, управление общими конфигурациями — только администратору.
 * @module setupStorageConfigRoutes
 */

import type { Express } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAdminAuth } from "../admin/admin-auth-middleware";

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
  /** Общий лимит попыток изменения и проверки хранилищ по IP на процесс. */
  const storageWriteLimit = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });
  app.get("/api/storage-configs", listStorageConfigsHandler);
  app.post("/api/storage-configs", storageWriteLimit, requireAdminAuth, createStorageConfigHandler);
  app.patch("/api/storage-configs/:id", storageWriteLimit, requireAdminAuth, updateStorageConfigHandler);
  app.delete("/api/storage-configs/:id", storageWriteLimit, requireAdminAuth, deleteStorageConfigHandler);
  app.post("/api/storage-configs/:id/test", storageWriteLimit, requireAdminAuth, testStorageConfigHandler);
}
