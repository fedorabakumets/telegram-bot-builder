/**
 * @fileoverview Маршруты интеграции с ботами: диалоги, группы, файлы
 * @module setupBotIntegrationRoutes
 */

import type { Express } from "express";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { requireMediaFileOwnership } from "../middleware/requireMediaFileOwnership";
import { getBotDataHandler, getAvatarHandler } from "./botIntegration/handlers/botData";
import { getTelegramFileHandler } from "./botIntegration/handlers/botData/getTelegramFileHandler";
import {
  getProjectFilesHandler,
  addProjectFileHandler,
  deleteProjectFilesHandler,
} from "./botIntegration/handlers/botData/getProjectFilesHandler";
import { updateMediaFileIdHandler } from "./botIntegration/handlers/botData/updateMediaFileIdHandler";
import { getStorageQuotaHandler } from "./botIntegration/handlers/botData/getStorageQuotaHandler";
import { getCollaboratorsInfoHandler } from "./botIntegration/handlers/botData/getCollaboratorsInfoHandler";
import {
  getMessagesHandler,
  sendMessageHandler,
  sendNodeMessageHandler,
  deleteMessagesHandler,
  deleteSingleMessageHandler,
  editSingleMessageHandler,
  getGroupMessagesHandler,
} from "./botIntegration/handlers/messages";
import { getGroupsHandler, syncGroupHandler } from "./botIntegration/handlers/groups";
import {
  getBotInfoHandler,
  updateBotNameHandler,
  updateBotDescriptionHandler,
  updateBotShortDescriptionHandler,
} from "./botIntegration/handlers/botInfo";
import { sendGroupMessageHandler } from "./botIntegration/handlers/telegramGroups";
import { setupBroadcastRoutes } from "./setupBroadcastRoutes";

/**
 * Регистрирует маршруты bot-integration для проекта.
 * @param app - Экземпляр Express
 * @returns void
 */
export function setupBotIntegrationRoutes(app: Express) {
  app.get("/api/projects/:projectId/bot/data", requireProjectAccess, getBotDataHandler);
  app.get(
    "/api/projects/:projectId/users/:userId/avatar",
    requireProjectAccess,
    getAvatarHandler,
  );
  app.get(
    "/api/projects/:projectId/telegram-file",
    requireProjectAccess,
    getTelegramFileHandler,
  );
  app.get("/api/projects/:projectId/files", requireProjectAccess, getProjectFilesHandler);
  app.post("/api/projects/:projectId/files", requireProjectAccess, addProjectFileHandler);
  app.post("/api/media/:id/file-id", requireMediaFileOwnership, updateMediaFileIdHandler);
  app.delete(
    "/api/projects/:projectId/files",
    requireProjectAccess,
    deleteProjectFilesHandler,
  );
  app.get(
    "/api/projects/:projectId/storage-quota",
    requireProjectAccess,
    getStorageQuotaHandler,
  );
  app.get(
    "/api/projects/:projectId/collaborators",
    requireProjectAccess,
    getCollaboratorsInfoHandler,
  );

  app.get(
    "/api/projects/:projectId/users/:userId/messages",
    requireProjectAccess,
    getMessagesHandler,
  );
  app.get(
    "/api/projects/:projectId/groups/:groupId/messages",
    requireProjectAccess,
    getGroupMessagesHandler,
  );
  app.post(
    "/api/projects/:projectId/users/:userId/send-message",
    requireProjectAccess,
    sendMessageHandler,
  );
  app.post(
    "/api/projects/:projectId/users/:userId/send-node-message",
    requireProjectAccess,
    sendNodeMessageHandler,
  );
  app.delete(
    "/api/projects/:projectId/users/:userId/messages",
    requireProjectAccess,
    deleteMessagesHandler,
  );
  app.delete(
    "/api/projects/:projectId/messages/:messageId",
    requireProjectAccess,
    deleteSingleMessageHandler,
  );
  app.patch(
    "/api/projects/:projectId/messages/:messageId",
    requireProjectAccess,
    editSingleMessageHandler,
  );

  app.get("/api/projects/:projectId/groups", requireProjectAccess, getGroupsHandler);
  app.post(
    "/api/projects/:projectId/groups/:groupId/sync",
    requireProjectAccess,
    syncGroupHandler,
  );

  app.get("/api/projects/:projectId/bot/info", requireProjectAccess, getBotInfoHandler);
  app.put("/api/projects/:projectId/bot/name", requireProjectAccess, updateBotNameHandler);
  app.put(
    "/api/projects/:projectId/bot/description",
    requireProjectAccess,
    updateBotDescriptionHandler,
  );
  app.put(
    "/api/projects/:projectId/bot/short-description",
    requireProjectAccess,
    updateBotShortDescriptionHandler,
  );
  app.post(
    "/api/projects/:projectId/bot/send-group-message",
    requireProjectAccess,
    sendGroupMessageHandler,
  );

  setupBroadcastRoutes(app);
}
