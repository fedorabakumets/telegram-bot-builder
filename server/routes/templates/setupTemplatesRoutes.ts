/**
 * @fileoverview Регистрация CRUD/engagement маршрутов `/api/templates`.
 * Seed refresh/recreate — только `/admin/api/templates/*`.
 * @module server/routes/templates/setupTemplatesRoutes
 */

import type { Express, NextFunction, Request, Response } from "express";

import { listTemplatesHandler } from "./handlers/listTemplatesHandler";
import { listFeaturedTemplatesHandler } from "./handlers/listFeaturedTemplatesHandler";
import { listTemplatesByCategoryHandler } from "./handlers/listTemplatesByCategoryHandler";
import { searchTemplatesHandler } from "./handlers/searchTemplatesHandler";
import { getTemplateHandler } from "./handlers/getTemplateHandler";
import { createTemplateHandler } from "./handlers/createTemplateHandler";
import { updateTemplateHandler } from "./handlers/updateTemplateHandler";
import { deleteTemplateHandler } from "./handlers/deleteTemplateHandler";
import { useTemplateHandler } from "./handlers/useTemplateHandler";
import {
  bookmarkTemplateHandler,
  downloadTemplateHandler,
  likeTemplateHandler,
  rateTemplateHandler,
  viewTemplateHandler,
} from "./handlers/templateEngagementHandlers";

/** Middleware готовности БД */
type DbReadyMiddleware = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Регистрирует маршруты библиотеки сценариев (без admin seed).
 * @param app - Express
 * @param requireDbReady - Middleware готовности БД
 * @returns void
 */
export function setupTemplatesRoutes(app: Express, requireDbReady: DbReadyMiddleware): void {
  app.get("/api/templates", requireDbReady, listTemplatesHandler);
  app.get("/api/templates/featured", listFeaturedTemplatesHandler);
  app.get("/api/templates/category/:category", listTemplatesByCategoryHandler);
  app.get("/api/templates/search", searchTemplatesHandler);
  app.get("/api/templates/:id", requireDbReady, getTemplateHandler);
  app.post("/api/templates", requireDbReady, createTemplateHandler);
  app.put("/api/templates/:id", updateTemplateHandler);
  app.delete("/api/templates/:id", deleteTemplateHandler);
  app.post("/api/templates/:id/use", requireDbReady, useTemplateHandler);
  app.post("/api/templates/:id/rate", rateTemplateHandler);
  app.post("/api/templates/:id/view", viewTemplateHandler);
  app.post("/api/templates/:id/download", downloadTemplateHandler);
  app.post("/api/templates/:id/like", likeTemplateHandler);
  app.post("/api/templates/:id/bookmark", bookmarkTemplateHandler);
}
