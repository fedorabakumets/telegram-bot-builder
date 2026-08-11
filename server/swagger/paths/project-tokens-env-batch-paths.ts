/**
 * @fileoverview OpenAPI: PUT env-batch токена проекта.
 * @module server/swagger/paths/project-tokens-env-batch-paths
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
  ProjectTokenEnvBatchRequestSchema,
  ProjectTokenEnvBatchResponseSchema,
} from "../schemas/project-tokens-env";

/**
 * Регистрирует PUT env-batch.
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @returns void
 */
export function registerProjectTokensEnvBatchPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-batch",
    tags: ["project-tokens"],
    summary: "Batch-обновление env / системных ключей",
    description:
      "`changes[]`: create/update/delete. Системные KEY → bot_tokens / project " +
      "(BOT_TOKEN, ADMIN_IDS, USER_DATABASE, LOG_LEVEL, PROTECT_CONTENT, …). " +
      "Остальные → bot_env_variables. WS `token-updated` при обновлении полей токена.\n\n" +
      "**Auth:** `requireTokenOwnership`.\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/env-batch \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"changes\":[{\"action\":\"update\",\"key\":\"LOG_LEVEL\",\"value\":\"WARNING\"}]}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: ProjectTokenEnvBatchRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Применено",
        content: {
          "application/json": {
            schema: ProjectTokenEnvBatchResponseSchema,
            example: {
              success: true,
              applied: 1,
              results: ["updated:LOG_LEVEL"],
            },
          },
        },
      },
      400: {
        description: "Пустой changes",
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
    },
  });
}
