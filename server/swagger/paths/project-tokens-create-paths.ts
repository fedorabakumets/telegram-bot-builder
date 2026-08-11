/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/tokens.
 * @module server/swagger/paths/project-tokens-create-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensIdParamsSchema } from "../schemas/project-tokens-params";
import {
  CreateBotTokenBodySchema,
  FullBotTokenSchema,
} from "../schemas/project-tokens-dto";

/**
 * Регистрирует создание токена проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensCreatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tokens",
    tags: ["project-tokens"],
    summary: "Создать токен (или вернуть дубликат)",
    description:
      "`insertBotTokenSchema`. `ownerId` из body игнорируется (сессия / owner проекта). " +
      "При отсутствии `botUsername` — auto getMe. Дубликат того же `token` → **200** full. " +
      "Новый → **201** full + WS `token-created`.\n\n" +
      "**Риск:** ответ содержит **сырой** Telegram token.\n\n" +
      "**Auth:** опционально `getOwnerIdFromRequest` + `hasProjectAccess` при сессии.\n\n" +
      "**Клиент:** модалка добавления бота.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/tokens -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Основной\",\"token\":\"7123…:AAH…\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensIdParamsSchema,
      body: {
        content: {
          "application/json": { schema: CreateBotTokenBodySchema },
        },
      },
    },
    responses: {
      201: {
        description: "Создан (полный token)",
        content: {
          "application/json": {
            schema: FullBotTokenSchema,
            example: {
              id: 7,
              projectId: 42,
              name: "Основной",
              token: "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
              botUsername: "my_bot",
            },
          },
        },
      },
      200: {
        description: "Дубликат — существующая запись (полный token)",
        content: { "application/json": { schema: FullBotTokenSchema } },
      },
      400: {
        description: "Zod validation",
        content: {
          "application/json": { schema: ValidationErrorSchema },
        },
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
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "You don't have permission to add tokens to this project",
            },
          },
        },
      },
      404: {
        description: "Проект не найден (при auth)",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Project not found" },
          },
        },
      },
    },
  });
}
