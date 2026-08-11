/**
 * @fileoverview OpenAPI: env-variables CRUD + env-batch токена.
 * @module server/swagger/paths/project-tokens-env-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectTokensEnvIdParamsSchema,
  ProjectTokensProjectTokenParamsSchema,
} from "../schemas/project-tokens-params";
import {
  ProjectTokenEnvCreateBodySchema,
  ProjectTokenEnvListSchema,
  ProjectTokenEnvVariableSchema,
} from "../schemas/project-tokens-env";
import { ENV_LIST_EXAMPLE } from "./project-tokens-examples";
import { registerProjectTokensEnvMutatePaths } from "./project-tokens-env-mutate-paths";

/**
 * Регистрирует GET/POST env-variables (+ mutate/batch).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensEnvPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const auth = "**Auth:** `requireTokenOwnership`. Reveal — отдельный path.\n\n";

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-variables",
    tags: ["project-tokens"],
    summary: "Список env токена (секреты маскируются)",
    description:
      "`{ items, count }`. Секреты → `••••••••`.\n\n" +
      auth +
      "**Клиент:** `use-env-variables` / BotEnvRow.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/tokens/7/env-variables -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
    },
    responses: {
      200: {
        description: "Список",
        content: {
          "application/json": {
            schema: ProjectTokenEnvListSchema,
            example: ENV_LIST_EXAMPLE,
          },
        },
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
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-variables",
    tags: ["project-tokens"],
    summary: "Создать env-переменную",
    description:
      "`key` regex `^[A-Z][A-Z0-9_]*$`. 409 если ключ есть.\n\n" +
      auth +
      "```bash\ncurl -s -X POST http://localhost:5000/api/projects/42/tokens/7/env-variables \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"key\":\"API_KEY\",\"value\":\"secret\",\"isSecret\":1}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: ProjectTokenEnvCreateBodySchema },
        },
      },
    },
    responses: {
      201: {
        description: "Создана (сырое value)",
        content: {
          "application/json": {
            schema: ProjectTokenEnvVariableSchema,
            example: {
              id: 15,
              tokenId: 7,
              key: "API_KEY",
              value: "secret",
              isSecret: 1,
            },
          },
        },
      },
      400: {
        description: "Некорректный key",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет владения",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      409: {
        description: "Ключ уже существует",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registerProjectTokensEnvMutatePaths(
    registry,
    cookieSecurity,
    ProjectTokensEnvIdParamsSchema,
  );
}
