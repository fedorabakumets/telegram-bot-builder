/**
 * @fileoverview Регистрация маршрутов чата поддержки платформы
 * @module server/support/setup-support-routes
 */

import type { Express } from "express";
import { requireAdminAuth } from "../admin/admin-auth-middleware";
import { passAdminPageToClient } from "../admin/admin-client-pages";
import {
  handleGetAdminSupportThreads,
  handleGetAdminSupportUnread,
} from "./handlers/admin-support-list-handlers";
import {
  handleGetAdminSupportThread,
  handlePatchAdminSupportThread,
  handlePostAdminSupportRead,
} from "./handlers/admin-support-thread-handlers";
import { handlePostAdminSupportMessage } from "./handlers/post-admin-support-message";
import { handleGetAdminSupportAttachment, handleGetUserSupportAttachment } from "./handlers/support-attachment-handlers";
import { supportFilesUpload } from "./support-upload";
import {
  handleGetUserSupportThread,
  handlePostUserSupportMessage,
  handlePostUserSupportRead,
} from "./handlers/user-support-handlers";

/**
 * Маршруты пользователя. Авторизацию обеспечивает глобальный requireApiAuth на /api.
 * @param app - Экземпляр Express
 */
export function setupUserSupportRoutes(app: Express): void {
  app.get("/api/support/thread", handleGetUserSupportThread);
  app.post("/api/support/messages", supportFilesUpload, handlePostUserSupportMessage);
  app.post("/api/support/read", handlePostUserSupportRead);
  app.get("/api/support/attachments/:id", handleGetUserSupportAttachment);
}

/**
 * Маршруты админки поддержки под requireAdminAuth и страница диалога в SPA
 * @param app - Экземпляр Express
 */
export function setupAdminSupportRoutes(app: Express): void {
  app.get("/admin/api/support/threads", requireAdminAuth, handleGetAdminSupportThreads);
  app.get("/admin/api/support/unread", requireAdminAuth, handleGetAdminSupportUnread);
  app.get("/admin/api/support/threads/:id", requireAdminAuth, handleGetAdminSupportThread);
  app.post(
    "/admin/api/support/threads/:id/messages",
    requireAdminAuth,
    supportFilesUpload,
    handlePostAdminSupportMessage,
  );
  app.post("/admin/api/support/threads/:id/read", requireAdminAuth, handlePostAdminSupportRead);
  app.patch("/admin/api/support/threads/:id", requireAdminAuth, handlePatchAdminSupportThread);
  app.get("/admin/api/support/attachments/:id", requireAdminAuth, handleGetAdminSupportAttachment);
  app.get("/admin/support/:id", passAdminPageToClient);
}
