/**
 * @fileoverview OpenAPI paths для серверных утилит (/api/server/*)
 * @module server/swagger/paths/server-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UnauthorizedSchema } from "../schemas/common";
import { ServerEnvKeysResponseSchema } from "../schemas/server";
import {
  SERVER_ENV_DENY_EXACT,
  SERVER_ENV_DENY_PREFIXES,
  SERVER_ENV_DENY_SUBSTRINGS,
} from "../../bots/botEnvPolicy";

/**
 * Регистрирует paths группы server.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security cookie сессии
 * @returns void
 */
export function registerServerPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<{ cookieAuth: string[] }>,
): void {
  const denylist =
    `${SERVER_ENV_DENY_EXACT.join(", ")}; имена с префиксами ${SERVER_ENV_DENY_PREFIXES.map((p) => `${p}*`).join(", ")}; ` +
    `имена, содержащие ${SERVER_ENV_DENY_SUBSTRINGS.join(", ")}`;

  registry.registerPath({
    method: "get",
    path: "/api/server/env-keys",
    tags: ["server"],
    summary: "Список серверных env-ключей для подстановки в бот",
    description:
      "Возвращает **только имена** серверных переменных, которые реально раскрываются в ссылках `${{KEY}}`: " +
      "перечисленные администратором в `WORKER_ENV_PASSTHROUGH`, не попавшие в denylist и заданные (не пустые). " +
      "**Значения не передаются.**\n\n" +
      "**Клиент:** вкладка «Переменные» у токена бота — `BotEnvPanel` и кнопка «Подставить из сервера» " +
      "(`BotEnvServerVarsPopover`). UI подставляет в custom env синтаксис `${{KEY}}`; при генерации `.env` бота " +
      "такие ссылки резолвятся из окружения Node-процесса на сервере (во всех режимах `WORKER_RUNTIME`).\n\n" +
      "**Denylist (нельзя обойти через WORKER_ENV_PASSTHROUGH):** " +
      denylist +
      ".\n\n" +
      "Если переменная не задана на сервере — она не возвращается (UI показывает локальный дефолт без `${{…}}`).\n\n" +
      "Требуется авторизация: сессионная cookie или Bearer PAT агента.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Доступные серверные ключи (без значений)",
        content: {
          "application/json": { schema: ServerEnvKeysResponseSchema },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      503: {
        description: "Приложение не прошло setup — глобальный setupGuard (настройка в /admin)",
      },
    },
  });
}
