/**
 * @fileoverview Настройка маршрутов для пользовательских таблиц проекта (Bot Tables)
 * @module routes/tables/setupTablesRoutes
 */

import type { Express } from "express";
import { requireProjectAccess } from "../../middleware/requireProjectAccess";
import { getTablesHandler } from "./handlers/getTablesHandler";
import { createTableHandler } from "./handlers/createTableHandler";
import { deleteTableHandler } from "./handlers/deleteTableHandler";
import { renameTableHandler } from "./handlers/renameTableHandler";
import { getColumnsHandler } from "./handlers/getColumnsHandler";
import { createColumnHandler } from "./handlers/createColumnHandler";
import { deleteColumnHandler } from "./handlers/deleteColumnHandler";
import { renameColumnHandler } from "./handlers/renameColumnHandler";
import { getRowsHandler } from "./handlers/getRowsHandler";
import { createRowsHandler } from "./handlers/createRowsHandler";
import { updateRowHandler } from "./handlers/updateRowHandler";
import { deleteRowHandler } from "./handlers/deleteRowHandler";
import { reindexRowsHandler } from "./handlers/reindexRowsHandler";

/**
 * Регистрирует маршруты для работы с пользовательскими таблицами проекта
 * @param app - Экземпляр приложения Express
 * @param requireDbReady - Middleware проверки готовности БД
 */
export function setupTablesRoutes(
  app: Express,
  requireDbReady: (_req: any, res: any, next: any) => any
): void {
  const base = "/api/projects/:id/tables";

  // Таблицы
  app.get(base, requireDbReady, requireProjectAccess, getTablesHandler);
  app.post(base, requireDbReady, requireProjectAccess, createTableHandler);
  app.delete(`${base}/:tableId`, requireDbReady, requireProjectAccess, deleteTableHandler);
  app.put(`${base}/:tableId`, requireDbReady, requireProjectAccess, renameTableHandler);

  // Колонки
  app.get(`${base}/:tableId/columns`, requireDbReady, requireProjectAccess, getColumnsHandler);
  app.post(`${base}/:tableId/columns`, requireDbReady, requireProjectAccess, createColumnHandler);
  app.delete(`${base}/:tableId/columns/:columnId`, requireDbReady, requireProjectAccess, deleteColumnHandler);
  app.put(`${base}/:tableId/columns/:columnId`, requireDbReady, requireProjectAccess, renameColumnHandler);

  // Строки
  app.get(`${base}/:tableId/rows`, requireDbReady, requireProjectAccess, getRowsHandler);
  app.post(`${base}/:tableId/rows/reindex`, requireDbReady, requireProjectAccess, reindexRowsHandler);
  app.post(`${base}/:tableId/rows`, requireDbReady, requireProjectAccess, createRowsHandler);
  app.put(`${base}/:tableId/rows/:rowId`, requireDbReady, requireProjectAccess, updateRowHandler);
  app.delete(`${base}/:tableId/rows/:rowId`, requireDbReady, requireProjectAccess, deleteRowHandler);
}
