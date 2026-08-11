/**
 * @fileoverview Детально описанные OpenAPI paths (эталонные эндпоинты)
 * @module server/swagger/register-documented-paths
 */

import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "./schemas/common";
import { registerAgentTokenPaths } from "./paths/agent-token-paths";
import { registerAuthPaths } from "./paths/auth-paths";
import { registerBotUsersPaths } from "./paths/bot-users-paths";
import { registerBotUsersStatsTrafficPaths } from "./paths/bot-users-stats-traffic-paths";
import { registerBotUsersGrowthPaths } from "./paths/bot-users-growth-paths";
import { registerBotUsersExtraPaths } from "./paths/bot-users-extra-paths";
import { registerBotTokensPaths } from "./paths/bot-tokens-paths";
import { registerBotStartOfflinePaths } from "./paths/bot-runtime-start-offline-paths";
import { registerBotsListPaths } from "./paths/bots-list-paths";
import { registerBotLogsPaths } from "./paths/bot-logs-paths";
import { registerBotEnvRevealPaths } from "./paths/bot-env-reveal-paths";
import { registerProjectTokensListPaths } from "./paths/project-tokens-list-paths";
import { registerProjectTokensCreatePaths } from "./paths/project-tokens-create-paths";
import { registerProjectTokensUpdatePaths } from "./paths/project-tokens-update-paths";
import { registerProjectTokensParsePaths } from "./paths/project-tokens-parse-paths";
import { registerProjectTokensBotInfoPaths } from "./paths/project-tokens-bot-info-paths";
import { registerProjectTokensSettingsTogglesPaths } from "./paths/project-tokens-settings-toggles-paths";
import { registerProjectTokensLogLaunchPaths } from "./paths/project-tokens-log-launch-paths";
import { registerProjectTokensUserbotPaths } from "./paths/project-tokens-userbot-paths";
import { registerProjectTokensEnvPaths } from "./paths/project-tokens-env-paths";
import { registerProjectTokensLiveLogsPaths } from "./paths/project-tokens-live-logs-paths";
import { registerBotApiPaths } from "./paths/bot-api-paths";
import { registerLaunchLogsPaths } from "./paths/launch-logs-paths";
import { registerMediaPaths } from "./paths/media-paths";
import { registerConfigSetupPaths } from "./paths/config-setup-paths";
import { registerAdminAppSettingsPaths } from "./paths/admin-app-settings-paths";
import { registerAdminBotFoldersCleanupPaths } from "./paths/admin-bot-folders-cleanup-paths";
import { registerDatabasePaths } from "./paths/database-paths";
import { registerHealthPaths } from "./paths/health-paths";
import { registerProjectsAdminIdsPaths } from "./paths/projects-admin-ids-paths";
import { registerProjectsCollaboratorsInfoPaths } from "./paths/projects-collaborators-info-paths";
import { registerProjectsCreateGetPaths } from "./paths/projects-create-get-paths";
import { registerProjectsDeletePaths } from "./paths/projects-delete-paths";
import { registerProjectsDuplicatePaths } from "./paths/projects-duplicate-paths";
import { registerProjectsExportPaths } from "./paths/projects-export-paths";
import { registerProjectsGeneratePaths } from "./paths/projects-generate-paths";
import { registerProjectsLaunchesAllPaths } from "./paths/projects-launches-all-paths";
import { registerProjectsListPaths } from "./paths/projects-list-paths";
import { registerProjectsLogsAllPaths } from "./paths/projects-logs-all-paths";
import { registerProjectsReorderPaths } from "./paths/projects-reorder-paths";
import { registerProjectsUpdatePaths } from "./paths/projects-update-paths";
import { registerProjectsUserDialogPaths } from "./paths/projects-user-dialog-paths";
import { registerProjectsVersionsCommitPaths } from "./paths/projects-versions-commit-paths";
import { registerProjectsVersionsDeletePaths } from "./paths/projects-versions-delete-paths";
import { registerProjectsVersionsGetPaths } from "./paths/projects-versions-get-paths";
import { registerProjectsVersionsListPaths } from "./paths/projects-versions-list-paths";
import { registerProjectsVersionsPrunePaths } from "./paths/projects-versions-prune-paths";
import { registerProjectsVersionsRestorePaths } from "./paths/projects-versions-restore-paths";
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
registerProjectsUpdatePaths(documentedRegistry, cookieSecurity);
registerProjectsDeletePaths(documentedRegistry, cookieSecurity);
registerProjectsDuplicatePaths(documentedRegistry, cookieSecurity);
registerProjectsAdminIdsPaths(documentedRegistry, cookieSecurity);
registerProjectsReorderPaths(documentedRegistry, cookieSecurity);
registerProjectsGeneratePaths(documentedRegistry, cookieSecurity);
registerProjectsExportPaths(documentedRegistry, cookieSecurity);
registerProjectsCollaboratorsInfoPaths(documentedRegistry, cookieSecurity);
registerProjectsLogsAllPaths(documentedRegistry, cookieSecurity);
registerProjectsLaunchesAllPaths(documentedRegistry, cookieSecurity);
registerProjectsVersionsListPaths(documentedRegistry, cookieSecurity);
registerProjectsVersionsCommitPaths(documentedRegistry, cookieSecurity);
registerProjectsVersionsGetPaths(documentedRegistry, cookieSecurity);
registerProjectsVersionsRestorePaths(documentedRegistry, cookieSecurity);
registerProjectsVersionsDeletePaths(documentedRegistry, cookieSecurity);
registerProjectsVersionsPrunePaths(documentedRegistry, cookieSecurity);
registerProjectsUserDialogPaths(documentedRegistry, cookieSecurity);

registerAgentTokenPaths(documentedRegistry, cookieSecurity);
registerBotUsersPaths(documentedRegistry, cookieSecurity);
registerBotUsersStatsTrafficPaths(documentedRegistry, cookieSecurity);
registerBotUsersGrowthPaths(documentedRegistry, cookieSecurity);
registerBotUsersExtraPaths(documentedRegistry, cookieSecurity);
registerBotTokensPaths(documentedRegistry, cookieSecurity);
registerProjectTokensListPaths(documentedRegistry, cookieSecurity);
registerProjectTokensCreatePaths(documentedRegistry, cookieSecurity);
registerProjectTokensUpdatePaths(documentedRegistry, cookieSecurity);
registerProjectTokensParsePaths(documentedRegistry, cookieSecurity);
registerProjectTokensBotInfoPaths(documentedRegistry, cookieSecurity);
registerProjectTokensSettingsTogglesPaths(documentedRegistry, cookieSecurity);
registerProjectTokensLogLaunchPaths(documentedRegistry, cookieSecurity);
registerProjectTokensUserbotPaths(documentedRegistry, cookieSecurity);
registerProjectTokensEnvPaths(documentedRegistry, cookieSecurity);
registerProjectTokensLiveLogsPaths(documentedRegistry, cookieSecurity);
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
