/**
 * @fileoverview OpenAPI paths для публичных HTTP hooks
 * @module server/swagger/paths/hooks-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import "../schemas/common";

/** Непрозрачный ответ прокси: Python api_response определяет JSON, текст, статус и Content-Type. */
const dynamicContent = {
  "application/json": { schema: z.unknown().openapi({ description: "Произвольное JSON-значение из api_response; единая схема не установлена" }) },
  "text/plain": { schema: z.string() },
  "*/*": { schema: z.string().openapi({ description: "Непрозрачное тело ответа upstream" }) },
};
/** Описывает известную ошибку, сохраняя возможность произвольного ответа api_response с тем же статусом. @param description - Источник ответа. @returns Контракт прокси. */
function response(description: string) { return { description, content: dynamicContent }; }

/**
 * Регистрирует OpenAPI paths для `/api/hooks/{projectId}/*`
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security (публичный эндпоинт)
 */
export function registerHooksPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  const methods = ["get", "post", "put", "patch", "delete"] as const;

  for (const method of methods) {
    registry.registerPath({
      method,
      path: "/api/hooks/{projectId}/{path}",
      tags: ["hooks"],
      summary: `HTTP hook (${method.toUpperCase()}) — api_trigger`,
      description:
        "**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).\n\n" +
        "**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.\n\n" +
        "**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).\n\n" +
        "См. также `docs/api/hooks.md`.",
      security: publicSecurity,
      request: {
        params: z.object({
          projectId: z.string().openapi({ example: "42" }),
          path: z.string().openapi({ example: "payment" }),
        }),
      },
      responses: {
        200: response('Успех api_response; произвольное тело, обычно JSON, либо дефолт {"ok":true}'),
        400: response('Node: {"error":"invalid_project"}; Python: {"error":"bad_request"}; возможен пользовательский ответ'),
        401: response('Python: {"error":"invalid_secret"}; возможен пользовательский ответ'),
        405: response('Python: {"error":"method_not_allowed"}; возможен пользовательский ответ'),
        413: response('Node/Python: {"error":"payload_too_large"}; возможен пользовательский ответ'),
        429: response('Node: {"error":"rate_limit"}; возможен пользовательский ответ'),
        500: response('Python: {"error":"internal_error"}; возможен пользовательский ответ'),
        502: response('Node: {"error":"proxy_error"}, включая таймаут fetch 35 секунд; возможен пользовательский ответ'),
        503: response('Node: {"error":"bot_offline"}; возможен пользовательский ответ'),
        504: response('Python: {"error":"timeout"}, если api_response не получен за 30 секунд; возможен пользовательский ответ'),
        default: response('Любой другой статус и Content-Type upstream api_response; общей формы тела нет'),
      },
    });
  }
}
