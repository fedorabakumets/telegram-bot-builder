/**
 * @fileoverview OpenAPI: PUT/DELETE env-variables/:id.
 * @module server/swagger/paths/project-tokens-env-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import type { ZodTypeAny } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  ProjectTokenEnvDeleteResponseSchema,
  ProjectTokenEnvUpdateBodySchema,
  ProjectTokenEnvVariableSchema,
} from "../schemas/project-tokens-env";
import { registerProjectTokensEnvBatchPaths } from "./project-tokens-env-batch-paths";

/**
 * Регистрирует mutate env (+ batch).
 * @param registry - Реестр
 * @param cookieSecurity - Security
 * @param envIdParams - Path schema projectId+tokenId+id
 * @returns void
 */
export function registerProjectTokensEnvMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
  envIdParams: ZodTypeAny,
): void {
  const auth = "**Auth:** `requireTokenOwnership`.\n\n";

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}",
    tags: ["project-tokens"],
    summary: "Обновить env-переменную",
    description:
      "Partial `{ key?, value?, isSecret? }`. Чужой id → 404 (сверка tokenId).\n\n" +
      auth +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/env-variables/15 \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"value\":\"new\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: envIdParams,
      body: {
        content: {
          "application/json": { schema: ProjectTokenEnvUpdateBodySchema },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлена",
        content: { "application/json": { schema: ProjectTokenEnvVariableSchema } },
      },
      400: {
        description: "Некорректный id/key",
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
      404: {
        description: "Не найдена / чужой tokenId",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      409: {
        description: "Конфликт key",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}",
    tags: ["project-tokens"],
    summary: "Удалить env-переменную",
    description:
      auth +
      "```bash\ncurl -s -X DELETE http://localhost:5000/api/projects/42/tokens/7/env-variables/15 \\\n" +
      "  -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: ProjectsCookiesSchema, params: envIdParams },
    responses: {
      200: {
        description: "Удалена",
        content: {
          "application/json": {
            schema: ProjectTokenEnvDeleteResponseSchema,
            example: { success: true },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет владения",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Не найдена",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registerProjectTokensEnvBatchPaths(registry, cookieSecurity);
}
