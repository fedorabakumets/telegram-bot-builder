/**
 * @fileoverview Маршруты рассылок и кампаний рассылок проекта
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
  getBroadcastCampaignHandler,
  listBroadcastCampaignsHandler,
  stopBroadcastCampaignHandler,
  editBroadcastCampaignHandler,
  deleteBroadcastCampaignHandler,
} from "./botIntegration/handlers/broadcasts";

/**
 * Регистрирует CRUD и preview рассылок, а также маршруты кампаний («большая рассылка»).
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

  // Кампании рассылок — «большая рассылка» по нескольким ботам проекта
  app.get(
    "/api/projects/:projectId/broadcast-campaigns",
    requireProjectAccess,
    listBroadcastCampaignsHandler,
  );
  app.get(
    "/api/projects/:projectId/broadcast-campaigns/:campaignId",
    requireProjectAccess,
    getBroadcastCampaignHandler,
  );
  app.post(
    "/api/projects/:projectId/broadcast-campaigns/:campaignId/stop",
    requireProjectAccess,
    stopBroadcastCampaignHandler,
  );
  app.put(
    "/api/projects/:projectId/broadcast-campaigns/:campaignId",
    requireProjectAccess,
    editBroadcastCampaignHandler,
  );
  app.delete(
    "/api/projects/:projectId/broadcast-campaigns/:campaignId",
    requireProjectAccess,
    deleteBroadcastCampaignHandler,
  );
}
