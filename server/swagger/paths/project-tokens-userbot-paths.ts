/**
 * @fileoverview OpenAPI: PUT …/userbot (настройки Telethon).
 * @module server/swagger/paths/project-tokens-userbot-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  UserbotPutRequestSchema,
  UserbotPutResponseSchema,
} from "../schemas/project-tokens-userbot";
import { registerProjectTokensUserbotAuthPaths } from "./project-tokens-userbot-auth-paths";

/**
 * Регистрирует PUT userbot (+ auth-шаги).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensUserbotPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/userbot",
    tags: ["project-tokens"],
    summary: "Настройки Telethon userbot",
    description:
      "Сохраняет `userbotEnabled` 0|1 и apiId/hash/session; пишет USERBOT_* в `.env`. " +
      "WS `token-updated` (changedFields: userbotEnabled).\n\n" +
      "**Auth:** `requireTokenOwnership`.\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/userbot \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"userbotEnabled\":1,\"userbotApiId\":\"123\",\"userbotApiHash\":\"abc\",\"userbotSessionString\":null}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: { "application/json": { schema: UserbotPutRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: UserbotPutResponseSchema,
            example: { success: true, userbotEnabled: 1 },
          },
        },
      },
      400: {
        description: "userbotEnabled не 0/1",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет владения токеном",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Токен не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registerProjectTokensUserbotAuthPaths(registry, cookieSecurity);
}
