/**
 * @fileoverview OpenAPI paths для пользовательских таблиц проекта
 * @module server/swagger/paths/database-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema } from "../schemas/common";
import { BotTableListSchema } from "../schemas/database";

/**
 * Регистрирует OpenAPI paths домена database (Bot Tables).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement
 * @returns void
 */
export function registerDatabasePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tables",
    tags: ["database"],
    summary: "Список таблиц контента проекта",
    description:
      "Возвращает пользовательские таблицы bot_tables для редактора Database. " +
      "Требует доступ к проекту (requireProjectAccess).",
    security: cookieSecurity,
    request: {
      params: z.object({
        /** ID проекта */
        id: z.string().openapi({ example: "42", description: "ID проекта" }),
      }),
    },
    responses: {
      200: {
        description: "Массив таблиц",
        content: { "application/json": { schema: BotTableListSchema } },
      },
      400: {
        description: "Некорректный ID проекта",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
