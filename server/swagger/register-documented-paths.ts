/**
 * @fileoverview Детально описанные OpenAPI paths (эталонные эндпоинты)
 * @module server/swagger/register-documented-paths
 */

import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "./schemas/common";
import { registerAgentTokenPaths } from "./paths/agent-token-paths";
import { registerAuthPaths } from "./paths/auth-paths";
import { registerBotUsersPaths } from "./paths/bot-users-paths";
import { registerBotTokensPaths } from "./paths/bot-tokens-paths";
import { registerBotStartOfflinePaths } from "./paths/bot-runtime-start-offline-paths";
import { registerBotsListPaths } from "./paths/bots-list-paths";
import { registerBotLogsPaths } from "./paths/bot-logs-paths";
import { registerBotEnvRevealPaths } from "./paths/bot-env-reveal-paths";
import { registerBotApiPaths } from "./paths/bot-api-paths";
import { registerLaunchLogsPaths } from "./paths/launch-logs-paths";
import { registerMediaPaths } from "./paths/media-paths";
import { registerConfigSetupPaths } from "./paths/config-setup-paths";
import { registerAdminAppSettingsPaths } from "./paths/admin-app-settings-paths";
import { registerAdminBotFoldersCleanupPaths } from "./paths/admin-bot-folders-cleanup-paths";
import { registerDatabasePaths } from "./paths/database-paths";
import { registerHealthPaths } from "./paths/health-paths";
import { registerProjectsAdminIdsPaths } from "./paths/projects-admin-ids-paths";
import { registerProjectsCreateGetPaths } from "./paths/projects-create-get-paths";
import { registerProjectsListPaths } from "./paths/projects-list-paths";
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

registerProjectsListPaths(documentedRegistry, cookieSecurity);
registerProjectsCreateGetPaths(documentedRegistry, cookieSecurity);
registerProjectsAdminIdsPaths(documentedRegistry, cookieSecurity);
registerProjectsPaths(documentedRegistry, cookieSecurity);

registerAgentTokenPaths(documentedRegistry, cookieSecurity);
registerBotUsersPaths(documentedRegistry, cookieSecurity);
registerBotTokensPaths(documentedRegistry, cookieSecurity);
registerBotStartOfflinePaths(documentedRegistry, cookieSecurity);
registerBotsListPaths(documentedRegistry, cookieSecurity);
registerBotLogsPaths(documentedRegistry, cookieSecurity);
registerBotEnvRevealPaths(documentedRegistry, cookieSecurity);
registerBotApiPaths(documentedRegistry, cookieSecurity);
registerLaunchLogsPaths(documentedRegistry, cookieSecurity);
registerMediaPaths(documentedRegistry, cookieSecurity);
registerConfigSetupPaths(documentedRegistry, publicSecurity);
registerAdminAppSettingsPaths(documentedRegistry);
registerAdminBotFoldersCleanupPaths(documentedRegistry);
registerStorageConfigPaths(documentedRegistry, cookieSecurity);
registerTemplatePaths(documentedRegistry, cookieSecurity);
registerWorkerPaths(documentedRegistry, cookieSecurity);
registerWebhookPaths(documentedRegistry, publicSecurity);
registerServerPaths(documentedRegistry, cookieSecurity);
registerDatabasePaths(documentedRegistry, cookieSecurity);
