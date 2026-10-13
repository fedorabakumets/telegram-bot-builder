/**
 * @fileoverview Настройка маршрутов для пользовательских таблиц проекта (Bot Tables)
 * @module routes/tables/setupTablesRoutes
 */

import type { Express, RequestHandler } from "express";
import { pool } from "../../database/db";
import { requireProjectAccess } from "../../middleware/requireProjectAccess";
import { setupTableChartRoutes } from "./chart/setup-table-chart-routes";
import { applyOpsHandler } from "./handlers/applyOpsHandler";
import { clearRowsHandler } from "./handlers/clearRowsHandler";
import { countRowsHandler, queryRowsHandler } from "./handlers/queryRowsHandler";
import { createColumnHandler } from "./handlers/createColumnHandler";
import { createRowsHandler } from "./handlers/createRowsHandler";
import { createTableHandler } from "./handlers/createTableHandler";
import { deleteColumnHandler } from "./handlers/deleteColumnHandler";
import { deleteRowHandler } from "./handlers/deleteRowHandler";
import { deleteTableHandler } from "./handlers/deleteTableHandler";
import { findTablesHandler } from "./handlers/findTablesHandler";
import { getColumnsHandler } from "./handlers/getColumnsHandler";
import { getRowHandler } from "./handlers/getRowHandler";
import { getRowsHandler } from "./handlers/getRowsHandler";
import { getTableHandler } from "./handlers/getTableHandler";
import { getTablesHandler } from "./handlers/getTablesHandler";
import { importBundleHandler } from "./handlers/importBundleHandler";
import { importRowsHandler } from "./handlers/importRowsHandler";
import { patchRowHandler } from "./handlers/patchRowHandler";
import { reindexRowsHandler } from "./handlers/reindexRowsHandler";
import { renameColumnHandler } from "./handlers/renameColumnHandler";
import { renameTableHandler } from "./handlers/renameTableHandler";
import { reorderColumnsHandler } from "./handlers/reorderColumnsHandler";
import { summaryHandler } from "./handlers/summaryHandler";
import { updateRowHandler } from "./handlers/updateRowHandler";

/**
 * Регистрирует маршруты для работы с пользовательскими таблицами проекта
 * @param app - Экземпляр приложения Express
 * @param requireDbReady - Middleware проверки готовности БД
 */
export function setupTablesRoutes(
  app: Express,
  requireDbReady: RequestHandler,
): void {
  const base = "/api/projects/:id/tables";
  const guard = [requireDbReady, requireProjectAccess] as const;

  app.get(base, ...guard, getTablesHandler);
  app.get(`${base}/search`, ...guard, findTablesHandler);
  app.post(`${base}/import`, ...guard, importBundleHandler);
  app.post(base, ...guard, createTableHandler);
  app.get(`${base}/:tableId`, ...guard, getTableHandler);
  app.put(`${base}/:tableId`, ...guard, renameTableHandler);
  app.delete(`${base}/:tableId`, ...guard, deleteTableHandler);
  app.post(`${base}/:tableId/apply-ops`, ...guard, applyOpsHandler);
  app.get(`${base}/:tableId/summary`, ...guard, summaryHandler);
  app.get(`${base}/:tableId/columns`, ...guard, getColumnsHandler);
  app.put(`${base}/:tableId/columns/reorder`, ...guard, reorderColumnsHandler);
  app.post(`${base}/:tableId/columns`, ...guard, createColumnHandler);
  app.put(`${base}/:tableId/columns/:columnId`, ...guard, renameColumnHandler);
  app.delete(`${base}/:tableId/columns/:columnId`, ...guard, deleteColumnHandler);
  app.get(`${base}/:tableId/rows`, ...guard, getRowsHandler);
  app.post(`${base}/:tableId/rows/query`, ...guard, queryRowsHandler);
  app.post(`${base}/:tableId/rows/count`, ...guard, countRowsHandler);
  app.post(`${base}/:tableId/rows/import`, ...guard, importRowsHandler);
  app.post(`${base}/:tableId/rows/reindex`, ...guard, reindexRowsHandler);
  app.delete(`${base}/:tableId/rows`, ...guard, clearRowsHandler);
  app.post(`${base}/:tableId/rows`, ...guard, createRowsHandler);
  app.get(`${base}/:tableId/rows/:rowId`, ...guard, getRowHandler);
  app.put(`${base}/:tableId/rows/:rowId`, ...guard, updateRowHandler);
  app.patch(`${base}/:tableId/rows/:rowId`, ...guard, patchRowHandler);
  app.delete(`${base}/:tableId/rows/:rowId`, ...guard, deleteRowHandler);
  setupTableChartRoutes(app, requireDbReady, requireProjectAccess, pool);
}
