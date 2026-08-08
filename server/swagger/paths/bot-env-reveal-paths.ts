/**
 * @fileoverview OpenAPI: reveal секретного значения env бота.
 * @module server/swagger/paths/bot-env-reveal-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { UnauthorizedSchema } from "../schemas/common";
import {
  BotEnvCookiesSchema,
  BotEnvIdParamsSchema,
  BotEnvNestedParamsSchema,
  BotEnvRevealErrorSchema,
  BotEnvRevealResponseSchema,
} from "../schemas/bot-env-reveal";

/** Общее предупреждение о чувствительности ответа */
const REVEAL_RISK =
  "**Риск:** ответ содержит **сырое** значение env (`API keys`, пароли, webhook secrets). " +
  "В списке переменных секреты маскируются; этот путь — кнопка «показать». " +
  "Любой владелец/collaborator проекта может прочитать все secret env токена. " +
  "Не логируйте тело ответа (прокси, HAR, access logs).\n\n";

/**
 * Регистрирует оба reveal-пути (legacy `/api/bot/env` и UI nested).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotEnvRevealPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/bot/env/{id}/reveal",
    tags: ["bot"],
    summary: "Раскрыть секретное значение env (legacy)",
    description:
      REVEAL_RISK +
      "**Кто может:** `resolveBotApiActor` + `requireBotEnvVariableOwnership` " +
      "(actor = session/PAT user или telegram_id при scope `bot_manager`).\n\n" +
      "UI Studio этот путь **не вызывает** (см. nested `/env-variables/…/reveal`).\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/bot/env/15/reveal?telegram_id=123456' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'   # PAT с bot_manager или свой id\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotEnvCookiesSchema,
      params: BotEnvIdParamsSchema,
      query: z.object({
        telegram_id: z.string().openapi({
          example: "123456789",
          param: {
            description: "Telegram user id для повторной проверки hasProjectAccess",
            example: "123456789",
          },
        }),
      }),
    },
    responses: {
      200: {
        description: "Сырое значение (секрет)",
        content: {
          "application/json": {
            schema: BotEnvRevealResponseSchema,
            example: { value: "super-secret-api-key" },
          },
        },
      },
      400: {
        description: "Нет telegram_id или некорректный id",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту токена",
        content: {
          "application/json": {
            schema: BotEnvRevealErrorSchema,
            example: { error: "Нет доступа" },
          },
        },
      },
      404: {
        description: "Переменная или токен не найдены",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}/reveal",
    tags: ["tokens"],
    summary: "Раскрыть секретное значение env токена",
    description:
      REVEAL_RISK +
      "**Кто может:** `requireTokenOwnership` (владелец/collaborator проекта). " +
      "Переменная должна принадлежать `tokenId` из URL, иначе 404.\n\n" +
      "**Клиент:** `use-env-variables` / кнопка глаза в `BotEnvRow`.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/tokens/7/env-variables/15/reveal -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotEnvCookiesSchema,
      params: BotEnvNestedParamsSchema,
    },
    responses: {
      200: {
        description: "Сырое значение (секрет)",
        content: {
          "application/json": {
            schema: BotEnvRevealResponseSchema,
            example: { value: "super-secret-api-key" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту токена",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
      404: {
        description: "Переменная не найдена / чужой tokenId",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
    },
  });
}
