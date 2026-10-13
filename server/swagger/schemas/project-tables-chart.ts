/**
 * @fileoverview OpenAPI-схемы графика пользовательской таблицы.
 */
import "./common";
import { z } from "zod";

/** Точка графика. */
export const TableChartPointSchema = z.object({
  /** Подпись группы. */
  label: z.string().openapi({ example: "Фото" }),
  /** Итог группы. */
  value: z.number().openapi({ example: 4 }),
}).openapi("TableChartPoint");

/** Параметры подсчёта. */
export const TableChartQuerySchema = z.object({
  /** Столбец групп. */
  xColumnId: z.string().openapi({ example: "3" }),
  /** Столбец значений. */
  yColumnId: z.string().openapi({ example: "4" }),
  /** Способ подсчёта. */
  aggregation: z.enum(["count", "sum", "avg", "min", "max"]).optional().openapi({ example: "count" }),
  /** Предел групп от 1 до 50. */
  limit: z.string().optional().openapi({ example: "50" }),
});

/** Ответ графика. */
export const TableChartResponseSchema = z.object({
  /** Проект. */
  project_id: z.number().openapi({ example: 42 }),
  /** Таблица. */
  table_id: z.number().openapi({ example: 1 }),
  /** Название таблицы. */
  table_name: z.string().openapi({ example: "_content" }),
  /** Столбец групп. */
  x_column_id: z.number().openapi({ example: 3 }),
  /** Название столбца групп. */
  x_column_name: z.string().openapi({ example: "type" }),
  /** Столбец значений. */
  y_column_id: z.number().openapi({ example: 4 }),
  /** Название столбца значений. */
  y_column_name: z.string().openapi({ example: "value" }),
  /** Фактический подсчёт. */
  aggregation: z.enum(["count", "sum", "avg", "min", "max"]).openapi({ example: "count" }),
  /** Столбец значения числовой. */
  y_is_numeric: z.boolean().openapi({ example: false }),
  /** Число строк. */
  row_count: z.number().openapi({ example: 12 }),
  /** Число групп до сокращения. */
  group_count: z.number().openapi({ example: 3 }),
  /** Предел групп. */
  limit: z.number().openapi({ example: 50 }),
  /** Ответ сокращён. */
  truncated: z.boolean().openapi({ example: false }),
  /** Точки. */
  points: z.array(TableChartPointSchema),
  /** Пояснения. */
  warnings: z.array(z.string()).openapi({ example: [] }),
}).openapi("TableChartResponse");

/** Сводка столбца для рекомендации. */
export const TableColumnProfileSchema = z.object({
  /** Столбец. */
  id: z.number().openapi({ example: 3 }),
  /** Название. */
  name: z.string().openapi({ example: "type" }),
  /** Непустые ячейки. */
  filled: z.number().openapi({ example: 12 }),
  /** Разные значения. */
  distinctCount: z.number().openapi({ example: 3 }),
  /** Средняя длина. */
  avgLength: z.number().openapi({ example: 5 }),
  /** Числовой столбец. */
  isNumeric: z.boolean().openapi({ example: false }),
}).openapi("TableColumnProfile");

/** Ответ рекомендации. */
export const TableChartSuggestionSchema = z.object({
  /** Проект. */
  project_id: z.number().openapi({ example: 42 }),
  /** Таблица. */
  table_id: z.number().openapi({ example: 1 }),
  /** Название таблицы. */
  table_name: z.string().openapi({ example: "_content" }),
  /** Число строк. */
  row_count: z.number().openapi({ example: 12 }),
  /** Столбец групп. */
  x_column_id: z.number().nullable().openapi({ example: 3 }),
  /** Название столбца групп. */
  x_column_name: z.string().nullable().openapi({ example: "type" }),
  /** Столбец значений. */
  y_column_id: z.number().nullable().openapi({ example: 4 }),
  /** Название столбца значений. */
  y_column_name: z.string().nullable().openapi({ example: "value" }),
  /** Подсчёт. */
  aggregation: z.enum(["count", "sum", "avg", "min", "max"]).nullable().openapi({ example: "count" }),
  /** Вид рисунка. */
  chart_type: z.enum(["bar", "line", "pie"]).nullable().openapi({ example: "pie" }),
  /** Пояснение. */
  reason: z.string().openapi({ example: "Для групп подходит «type»." }),
  /** Столбцы. */
  columns: z.array(TableColumnProfileSchema),
}).openapi("TableChartSuggestion");
