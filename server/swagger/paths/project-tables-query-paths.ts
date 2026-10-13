/**
 * @fileoverview OpenAPI: чтение, поиск и пакеты пользовательских таблиц
 * @module server/swagger/paths/project-tables-query-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseAuthHeadersSchema, DatabaseCookiesSchema, DatabaseProjectIdParamsSchema } from "../schemas/database";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import {
  ApplyTableOpsBodySchema,
  ApplyTableOpsErrorSchema,
  QueryTableRowsBodySchema,
  QueryTableRowsResultSchema,
} from "../schemas/project-tables-query";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";

/**
 * Регистрирует ограниченные запросы и пакет операций
 * @param registry - Реестр OpenAPI
 * @param cookieSecurity - Cookie или Bearer
 */
export function registerProjectTablesQueryPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const requestBase = { cookies: DatabaseCookiesSchema, headers: DatabaseAuthHeadersSchema };
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tables/search",
    tags: ["project-tables"],
    summary: "Найти таблицы по части имени",
    description: "Только пользовательские bot_tables. Параметр q обязателен, limit от 1 до 100.",
    security: cookieSecurity,
    request: { ...requestBase, params: DatabaseProjectIdParamsSchema },
    responses: { 200: { description: "Найденные таблицы" }, 400: { description: "Нет q", content: { "application/json": { schema: MessageErrorSchema } } }, ...PROJECT_TABLES_AUTH_ERRORS },
  });
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tables/{tableId}",
    tags: ["project-tables"],
    summary: "Таблица, столбцы и сводка",
    description: "Столбцы содержат числовой id и имя. Чужой tableId даёт 404.",
    security: cookieSecurity,
    request: { ...requestBase, params: TableIdParamsSchema },
    responses: { 200: { description: "Схема" }, 404: { description: "Таблица не найдена", content: { "application/json": { schema: MessageErrorSchema } } }, ...PROJECT_TABLES_AUTH_ERRORS },
  });
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tables/{tableId}/rows/query",
    tags: ["project-tables"],
    summary: "Страница строк с фильтрами",
    description: "До 5 условий, limit по умолчанию 100 и не больше 500, таймаут SQL 5 с. Старый GET …/rows без лимита сохранён для интерфейса.",
    security: cookieSecurity,
    request: {
      ...requestBase,
      params: TableIdParamsSchema,
      body: { content: { "application/json": { schema: QueryTableRowsBodySchema } } },
    },
    responses: {
      200: { description: "Страница", content: { "application/json": { schema: QueryTableRowsResultSchema } } },
      400: { description: "Плохой фильтр", content: { "application/json": { schema: MessageErrorSchema } } },
      ...PROJECT_TABLES_AUTH_ERRORS,
    },
  });
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tables/{tableId}/apply-ops",
    tags: ["project-tables"],
    summary: "Пакет операций в одной транзакции",
    description: "До 50 операций. Удаление требует confirm: true. Ошибка возвращает failed_op_index и откатывает пакет. Уведомление Redis одно.",
    security: cookieSecurity,
    request: {
      ...requestBase,
      params: TableIdParamsSchema,
      body: { content: { "application/json": { schema: ApplyTableOpsBodySchema } } },
    },
    responses: {
      200: { description: "Результаты по порядку" },
      400: { description: "Откат", content: { "application/json": { schema: ApplyTableOpsErrorSchema } } },
      ...PROJECT_TABLES_AUTH_ERRORS,
    },
  });
}
