/**
 * @fileoverview OpenAPI: график и рекомендация по пользовательской таблице.
 */
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseAuthHeadersSchema, DatabaseCookiesSchema } from "../schemas/database";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import { TableChartQuerySchema, TableChartResponseSchema, TableChartSuggestionSchema } from "../schemas/project-tables-chart";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";

/**
 * Регистрирует чтение графика и подбор столбцов.
 * @param registry - Реестр OpenAPI.
 * @param cookieSecurity - Cookie или Bearer.
 * @returns Ничего.
 */
export function registerProjectTablesChartPaths(registry: OpenAPIRegistry, cookieSecurity: Array<Record<string, string[]>>): void {
  registry.registerPath({
    method: "get", path: "/api/projects/{id}/tables/{tableId}/chart", tags: ["project-tables"],
    summary: "График по таблице",
    description: "Группирует строки таблицы проекта. Не больше 50 групп. Чужая таблица и чужой столбец не раскрываются.",
    security: cookieSecurity,
    request: { cookies: DatabaseCookiesSchema, headers: DatabaseAuthHeadersSchema, params: TableIdParamsSchema, query: TableChartQuerySchema },
    responses: {
      200: { description: "Точки графика", content: { "application/json": { schema: TableChartResponseSchema } } },
      400: { description: "Некорректные параметры или чужой столбец", content: { "application/json": { schema: MessageErrorSchema, example: { message: "Столбец не принадлежит таблице" } } } },
      404: { description: "Таблица не найдена в проекте", content: { "application/json": { schema: MessageErrorSchema, example: { message: "Таблица не найдена" } } } },
      ...PROJECT_TABLES_AUTH_ERRORS,
      500: { description: "Ошибка подсчёта", content: { "application/json": { schema: MessageErrorSchema, example: { message: "Не удалось построить график" } } } },
    },
  });
  registry.registerPath({
    method: "get", path: "/api/projects/{id}/tables/{tableId}/chart/recommendations", tags: ["project-tables"],
    summary: "Рекомендация графика по таблице",
    description: "Предлагает столбцы, подсчёт и вид рисунка по сводке значений, не возвращая сами строки.",
    security: cookieSecurity,
    request: { cookies: DatabaseCookiesSchema, headers: DatabaseAuthHeadersSchema, params: TableIdParamsSchema },
    responses: {
      200: { description: "Рекомендация", content: { "application/json": { schema: TableChartSuggestionSchema } } },
      404: { description: "Таблица не найдена в проекте", content: { "application/json": { schema: MessageErrorSchema, example: { message: "Таблица не найдена" } } } },
      ...PROJECT_TABLES_AUTH_ERRORS,
    },
  });
}
