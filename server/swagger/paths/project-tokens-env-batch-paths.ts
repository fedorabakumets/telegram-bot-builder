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
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
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
      "**Маскированные секреты не пишутся в БД.** Значение `BOT_TOKEN` вида " +
      "`123456:••••••••` / с `•` `*` `…` / не `digits:secret` → `skipped:BOT_TOKEN:masked` " +
      "(тот же `isMaskedOrPlaceholderToken`, что у PUT токена). " +
      "`WEBHOOK_SECRET_TOKEN` с символами маски → `skipped:WEBHOOK_SECRET_TOKEN:masked`. " +
      "Иначе Studio могла затереть реальный токен маской из GET и бот стартовал бы с Not Found.\n\n" +
      "**Auth:** `requireTokenOwnership`.\n\n" +
      "**Клиент:** `BotEnvPanel` / `use-env-pending-changes` (save / saveAndRestart).\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/env-batch \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"changes\":[{\"action\":\"update\",\"key\":\"LOG_LEVEL\",\"value\":\"WARNING\"}]}'\n```\n\n" +
      "Маскированный BOT_TOKEN (не меняет БД):\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/env-batch \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"changes\":[{\"action\":\"update\",\"key\":\"BOT_TOKEN\",\"value\":\"7123456789:••••••••\"}]}'\n" +
      "# → {\"success\":true,\"applied\":1,\"results\":[\"skipped:BOT_TOKEN:masked\"]}\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: ProjectTokenEnvBatchRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Применено (в results могут быть skipped:*:masked)",
        content: {
          "application/json": {
            schema: ProjectTokenEnvBatchResponseSchema,
            examples: {
              updated: {
                summary: "Системный ключ обновлён",
                value: {
                  success: true,
                  applied: 1,
                  results: ["updated:LOG_LEVEL"],
                },
              },
              skippedMaskedBotToken: {
                summary: "Маска BOT_TOKEN проигнорирована",
                value: {
                  success: true,
                  applied: 1,
                  results: ["skipped:BOT_TOKEN:masked"],
                },
              },
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
