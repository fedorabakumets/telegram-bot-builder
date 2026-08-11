/**
 * @fileoverview Маршруты рассылок проекта
 * @module setupBroadcastRoutes
 */

import type { Express } from "express";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import {
  createBroadcastHandler,
  getBroadcastsHandler,
  getBroadcastDetailHandler,
  stopBroadcastHandler,
  previewAudienceHandler,
  deleteBroadcastHandler,
  editBroadcastHandler,
} from "./botIntegration/handlers/broadcasts";

/**
 * Регистрирует CRUD и preview рассылок.
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupBroadcastRoutes(app: Express): void {
  app.get("/api/projects/:projectId/broadcasts", requireProjectAccess, getBroadcastsHandler);
  app.post("/api/projects/:projectId/broadcasts", requireProjectAccess, createBroadcastHandler);
  app.post(
    "/api/projects/:projectId/broadcasts/preview-audience",
    requireProjectAccess,
    previewAudienceHandler,
  );
  app.get(
    "/api/projects/:projectId/broadcasts/:broadcastId",
    requireProjectAccess,
    getBroadcastDetailHandler,
  );
  app.post(
    "/api/projects/:projectId/broadcasts/:broadcastId/stop",
    requireProjectAccess,
    stopBroadcastHandler,
  );
  app.put(
    "/api/projects/:projectId/broadcasts/:broadcastId",
    requireProjectAccess,
    editBroadcastHandler,
  );
  app.delete(
    "/api/projects/:projectId/broadcasts/:broadcastId",
    requireProjectAccess,
    deleteBroadcastHandler,
  );
}
