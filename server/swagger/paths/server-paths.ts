/**
 * @fileoverview OpenAPI paths для серверных утилит (/api/server/*)
 * @module server/swagger/paths/server-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UnauthorizedSchema } from "../schemas/common";
import { ServerEnvKeysResponseSchema } from "../schemas/server";
import { ALLOWED_SERVER_ENV_KEYS } from "../../constants/allowed-server-env-keys";

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
  const whitelist = ALLOWED_SERVER_ENV_KEYS.join(", ");

  registry.registerPath({
    method: "get",
    path: "/api/server/env-keys",
    tags: ["server"],
    summary: "Список серверных env-ключей для подстановки в бот",
    description:
      "Возвращает **только имена** переменных из whitelist серверного `process.env`, " +
      "которые заданы и не пустые. **Значения не передаются** — секреты (DATABASE_URL, пароли PG и т.д.) не попадают в браузер.\n\n" +
      "**Клиент:** вкладка «Переменные» у токена бота — `BotEnvPanel` и кнопка «Подставить из сервера» " +
      "(`BotEnvServerVarsPopover`). UI подставляет в custom env синтаксис `${{KEY}}`; при генерации `.env` бота " +
      "такие ссылки резолвятся из окружения Node-процесса на сервере.\n\n" +
      "**Whitelist (фиксированный):** " +
      whitelist +
      ".\n\n" +
      "В `items` только ключи из whitelist, для которых `process.env[KEY]` определён и не пустой. " +
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
        description: "Приложение не прошло setup (/setup) — глобальный setupGuard",
      },
    },
  });
}
