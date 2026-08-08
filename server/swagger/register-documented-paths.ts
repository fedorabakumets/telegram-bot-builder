/**
 * @fileoverview Детально описанные OpenAPI paths (эталонные эндпоинты)
 * @module server/swagger/register-documented-paths
 */

import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import "./schemas/common";
import {
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "./schemas/common";
import {
  BotProjectSchema,
  CreateProjectRequestSchema,
  CreateProjectUnauthorizedSchema,
} from "./schemas/projects";
import { registerAgentTokenPaths } from "./paths/agent-token-paths";
import { registerAuthPaths } from "./paths/auth-paths";
import { registerBotUsersPaths } from "./paths/bot-users-paths";
import { registerBotTokensPaths } from "./paths/bot-tokens-paths";
import { registerBotStartOfflinePaths } from "./paths/bot-runtime-start-offline-paths";
import { registerBotsListPaths } from "./paths/bots-list-paths";
import { registerBotLogsPaths } from "./paths/bot-logs-paths";
import { registerLaunchLogsPaths } from "./paths/launch-logs-paths";
import { registerConfigSetupPaths } from "./paths/config-setup-paths";
import { registerAdminAppSettingsPaths } from "./paths/admin-app-settings-paths";
import { registerAdminBotFoldersCleanupPaths } from "./paths/admin-bot-folders-cleanup-paths";
import { registerDatabasePaths } from "./paths/database-paths";
import { registerHealthPaths } from "./paths/health-paths";
import { registerProjectsPaths } from "./paths/projects-paths";
import { registerStorageConfigPaths } from "./paths/storage-config-paths";
import { registerTemplatePaths } from "./paths/template-paths";
import { registerWorkerPaths } from "./paths/worker-paths";
import { registerWebhookPaths } from "./paths/webhook-paths";
import { registerServerPaths } from "./paths/server-paths";

/** Реестр Zod-схем и paths для генерации OpenAPI */
export const documentedRegistry = new OpenAPIRegistry();

documentedRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "connect.sid",
  description: "Сессия после успешного login (POST /api/auth/telegram или miniapp/dev-login)",
});

documentedRegistry.registerComponent("securitySchemes", "agentToken", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "PAT",
  description: "Персональный токен агента (MCP/CLI)",
});

documentedRegistry.registerComponent("securitySchemes", "adminCookie", {
  type: "apiKey",
  in: "cookie",
  name: "admin_auth",
  description: "Admin cookie после POST /admin/api/login (ADMIN_API_KEY)",
});

const cookieSecurity = [{ cookieAuth: [] as string[] }];
const publicSecurity: never[] = [];

registerHealthPaths(documentedRegistry, publicSecurity);
registerAuthPaths(documentedRegistry, publicSecurity);

documentedRegistry.registerPath({
  method: "post",
  path: "/api/projects",
  tags: ["projects"],
  summary: "Создать проект",
  description: "Требует авторизацию. ownerId берётся из сессии, не из тела запроса.",
  security: cookieSecurity,
  request: {
    body: { content: { "application/json": { schema: CreateProjectRequestSchema } } },
  },
  responses: {
    201: {
      description: "Проект создан",
      content: { "application/json": { schema: BotProjectSchema } },
    },
    400: {
      description: "Ошибка валидации Zod",
      content: { "application/json": { schema: ValidationErrorSchema } },
    },
    401: {
      description: "Гость без авторизации",
      content: { "application/json": { schema: CreateProjectUnauthorizedSchema } },
    },
  },
});

documentedRegistry.registerPath({
  method: "get",
  path: "/api/projects/{id}",
  tags: ["projects"],
  summary: "Получить проект по ID",
  description: "Требует доступ к проекту (владелец или collaborator).",
  security: cookieSecurity,
  request: {
    params: z.object({
      /** ID проекта */
      id: z.string().openapi({ example: "42", description: "ID проекта" }),
    }),
  },
  responses: {
    200: {
      description: "Данные проекта",
      content: { "application/json": { schema: BotProjectSchema } },
    },
    400: {
      description: "id не число",
      content: { "application/json": { schema: MessageErrorSchema } },
    },
    401: {
      description: "Не авторизован",
      content: { "application/json": { schema: UnauthorizedSchema } },
    },
    404: {
      description: "Проект не найден",
      content: { "application/json": { schema: MessageErrorSchema } },
    },
  },
});

registerAgentTokenPaths(documentedRegistry, cookieSecurity);
registerBotUsersPaths(documentedRegistry, cookieSecurity);
registerBotTokensPaths(documentedRegistry, cookieSecurity);
registerBotStartOfflinePaths(documentedRegistry, cookieSecurity);
registerBotsListPaths(documentedRegistry, cookieSecurity);
registerBotLogsPaths(documentedRegistry, cookieSecurity);
registerLaunchLogsPaths(documentedRegistry, cookieSecurity);
registerProjectsPaths(documentedRegistry, cookieSecurity);
registerConfigSetupPaths(documentedRegistry, publicSecurity);
registerAdminAppSettingsPaths(documentedRegistry);
registerAdminBotFoldersCleanupPaths(documentedRegistry);
registerStorageConfigPaths(documentedRegistry, cookieSecurity);
registerTemplatePaths(documentedRegistry, cookieSecurity);
registerWorkerPaths(documentedRegistry, cookieSecurity);
registerWebhookPaths(documentedRegistry, publicSecurity);
registerServerPaths(documentedRegistry, cookieSecurity);
registerDatabasePaths(documentedRegistry, cookieSecurity);
