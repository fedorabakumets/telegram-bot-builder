/**
 * @fileoverview OpenAPI: флаги catch-all, блокировок пользователей и кэша контента.
 * @module server/swagger/paths/project-tokens-settings-flags-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  CatchAllHandlersRequestSchema,
  CatchAllHandlersResponseSchema,
  ContentCacheRequestSchema,
  ContentCacheResponseSchema,
  TrackUserBlocksRequestSchema,
  TrackUserBlocksResponseSchema,
} from "../schemas/project-tokens-settings";
import { PROJECT_TOKEN_SETTINGS_ERRORS } from "./project-tokens-settings-errors";

/**
 * Регистрирует флаги генерации поведения бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensSettingsFlagsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const auth =
    "**Auth:** `requireTokenOwnership`. WS `token-updated`. В env бота (при следующем запуске) — 0/1.\n\n";

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/track-user-blocks",
    tags: ["project-tokens"],
    summary: "Отслеживание блокировок пользователей",
    description: "`trackUserBlocks` 0|1 — обработчик Telegram my_chat_member и системные события в диалогах.\n\n" + auth,
    security: cookieSecurity,
    request: { cookies: ProjectsCookiesSchema, headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: { content: { "application/json": { schema: TrackUserBlocksRequestSchema } } } },
    responses: { 200: { description: "Сохранено", content: { "application/json": {
      schema: TrackUserBlocksResponseSchema, example: { success: true, trackUserBlocks: 1 },
    } } }, ...PROJECT_TOKEN_SETTINGS_ERRORS },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/catch-all-handlers",
    tags: ["project-tokens"],
    summary: "Catch-all обработчики (CATCH_ALL_HANDLERS)",
    description:
      "`catchAllHandlers` 0|1 — генерация handle_unhandled_* / fallback_callback.\n\n" +
      auth +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/catch-all-handlers \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"catchAllHandlers\":1}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: CatchAllHandlersRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: CatchAllHandlersResponseSchema,
            example: { success: true, catchAllHandlers: 1 },
          },
        },
      },
      ...PROJECT_TOKEN_SETTINGS_ERRORS,
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/content-cache",
    tags: ["project-tokens"],
    summary: "Живое обновление _content (CONTENT_CACHE)",
    description:
      "`contentCache` 0|1 — load/reload_content / redis subscribe. get_content всегда.\n\n" +
      auth +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/content-cache \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"contentCache\":1}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: ContentCacheRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: ContentCacheResponseSchema,
            example: { success: true, contentCache: 1 },
          },
        },
      },
      ...PROJECT_TOKEN_SETTINGS_ERRORS,
    },
  });
}
