/**
 * @fileoverview OpenAPI: auto-restart / protect-content / save-incoming-media.
 * @module server/swagger/paths/project-tokens-settings-toggles-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  AutoRestartRequestSchema,
  AutoRestartResponseSchema,
  ProtectContentRequestSchema,
  ProtectContentResponseSchema,
  SaveIncomingMediaRequestSchema,
  SaveIncomingMediaResponseSchema,
} from "../schemas/project-tokens-settings";
import { PROJECT_TOKEN_SETTINGS_ERRORS } from "./project-tokens-settings-errors";
import { registerProjectTokensSettingsFlagsPaths } from "./project-tokens-settings-flags-paths";

/**
 * Регистрирует toggles настроек токена (+ catch-all/content-cache).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensSettingsTogglesPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const auth =
    "**Auth:** `requireTokenOwnership`. WS `token-updated`. Часть флагов пишет `.env`.\n\n";

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/auto-restart",
    tags: ["project-tokens"],
    summary: "Автоперезапуск бота",
    description:
      "`autoRestart` 0|1, `maxRestartAttempts` 1–10.\n\n" +
      auth +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/auto-restart \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"autoRestart\":1,\"maxRestartAttempts\":3}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: { "application/json": { schema: AutoRestartRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: AutoRestartResponseSchema,
            example: { success: true, autoRestart: 1, maxRestartAttempts: 3 },
          },
        },
      },
      ...PROJECT_TOKEN_SETTINGS_ERRORS,
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/protect-content",
    tags: ["project-tokens"],
    summary: "Защита контента (PROTECT_CONTENT)",
    description:
      "`protectContent` 0|1 → `.env` PROTECT_CONTENT=true/false.\n\n" +
      auth +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/protect-content \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"protectContent\":1}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: { "application/json": { schema: ProtectContentRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: ProtectContentResponseSchema,
            example: { success: true, protectContent: 1 },
          },
        },
      },
      ...PROJECT_TOKEN_SETTINGS_ERRORS,
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/save-incoming-media",
    tags: ["project-tokens"],
    summary: "Сохранять входящие медиа",
    description:
      "`saveIncomingMedia` 0|1 → `.env` SAVE_INCOMING_MEDIA.\n\n" +
      auth +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/save-incoming-media \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"saveIncomingMedia\":1}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: SaveIncomingMediaRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: SaveIncomingMediaResponseSchema,
            example: { success: true, saveIncomingMedia: 1 },
          },
        },
      },
      ...PROJECT_TOKEN_SETTINGS_ERRORS,
    },
  });

  registerProjectTokensSettingsFlagsPaths(registry, cookieSecurity);
}
