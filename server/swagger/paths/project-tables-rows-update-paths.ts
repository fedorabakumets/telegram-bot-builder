/**
 * @fileoverview OpenAPI: PUT …/rows/{rowId}.
 * @module server/swagger/paths/project-tables-rows-update-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import { RowParamsSchema } from "../schemas/project-tables-params";
import {
  BotTableRowSchema,
  UpdateBotTableRowBodySchema,
} from "../schemas/project-tables-rows";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import {
  ROW_EXAMPLE,
  UPDATE_ROW_BODY_EXAMPLE,
} from "./project-tables-examples";

/**
 * Регистрирует обновление строки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesRowsUpdatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}/tables/{tableId}/rows/{rowId}",
    tags: ["project-tables"],
    summary: "Обновить строку",
    description:
      "Тело `{ data: object }`. Side-effects: если таблица `_content` — " +
      "`syncTableToScenario`; Redis `bot:table_updated:{projectId}` с JSON `{tableId}`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42/tables/1/rows/10 \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"data\":{\"3\":\"150\",\"4\":\"Товар A\"}}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: RowParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateBotTableRowBodySchema,
            example: UPDATE_ROW_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённая строка",
        content: {
          "application/json": {
            schema: BotTableRowSchema,
            example: { ...ROW_EXAMPLE, data: UPDATE_ROW_BODY_EXAMPLE.data },
          },
        },
      },
      400: {
        description: "Нет data или некорректный rowId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "Поле data обязательно и должно быть объектом",
            },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      404: {
        description: "Строка не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Строка не найдена" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось обновить строку" },
          },
        },
      },
    },
  });
}
