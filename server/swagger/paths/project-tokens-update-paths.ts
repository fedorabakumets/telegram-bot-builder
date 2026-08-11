/**
 * @fileoverview OpenAPI: PUT /api/projects/{id}/tokens/{tokenId}.
 * @module server/swagger/paths/project-tokens-update-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensIdTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  PublicBotTokenSchema,
  UpdateBotTokenBodySchema,
} from "../schemas/project-tokens-dto";
import { PUBLIC_TOKEN_WITH_BOT_ID_EXAMPLE } from "./project-tokens-examples";

/**
 * Регистрирует обновление токена проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensUpdatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const { botId: _b, ...publicExample } = PUBLIC_TOKEN_WITH_BOT_ID_EXAMPLE;

  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}/tokens/{tokenId}",
    tags: ["project-tokens"],
    summary: "Обновить токен (masked ответ)",
    description:
      "`insertBotTokenSchema.partial()`. Маскированный/`••••` token **игнорируется** " +
      "(`isMaskedOrPlaceholderToken`). Ответ — `toPublicBotToken`. " +
      "WS `token-updated` (source=api).\n\n" +
      "**Auth:** опционально `getOwnerIdFromRequest` + `hasProjectAccess`; " +
      "при auth также сверка `token.projectId`.\n\n" +
      "**Клиент:** редактирование карточки токена.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"name\":\"Новое имя\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensIdTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: UpdateBotTokenBodySchema },
        },
      },
    },
    responses: {
      200: {
        description: "Публичный токен",
        content: {
          "application/json": {
            schema: PublicBotTokenSchema,
            example: publicExample,
          },
        },
      },
      400: {
        description: "Zod validation",
        content: { "application/json": { schema: ValidationErrorSchema } },
      },
      401: {
        description: "Глобальный requireApiAuth",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа (при auth)",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      404: {
        description: "Проект/токен не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Token not found" },
          },
        },
      },
    },
  });
}
