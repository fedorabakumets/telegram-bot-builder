/**
 * @fileoverview OpenAPI-схемы запросов, пакетов и импорта таблиц
 * @module server/swagger/schemas/project-tables-query
 */

import "./common";
import { z } from "zod";

/** Условие фильтра строк */
export const TableRowFilterSchema = z.object({
  /** Числовой id столбца */
  column_id: z.number().int(),
  /** Оператор белого списка */
  operator: z.enum([
    "equals", "not_equals", "contains", "starts_with", "ends_with",
    "filled", "empty", "greater_than", "less_than",
  ]),
  /** Значение, кроме filled и empty */
  value: z.string().max(500).optional(),
}).openapi("TableRowFilter");

/** Тело ограниченного запроса строк */
export const QueryTableRowsBodySchema = z.object({
  /** До пяти условий */
  filters: z.array(TableRowFilterSchema).max(5).optional(),
  /** Предел, по умолчанию 100, не больше 500 */
  limit: z.number().int().min(1).max(500).optional(),
  /** Смещение */
  offset: z.number().int().min(0).optional(),
  /** id, row_index или column:<id> */
  sort: z.string().optional(),
  /** Какие столбцы оставить */
  columns: z.array(z.number().int()).optional(),
}).openapi("QueryTableRowsBody");

/** Страница строк */
export const QueryTableRowsResultSchema = z.object({
  /** Строки страницы */
  rows: z.array(z.record(z.string(), z.unknown())),
  /** Сколько всего подошло */
  total: z.number().int(),
  /** Предел */
  limit: z.number().int(),
  /** Смещение */
  offset: z.number().int(),
}).openapi("QueryTableRowsResult");

/** Подтверждение необратимого действия */
export const ConfirmBodySchema = z.object({
  /** Обязательное согласие */
  confirm: z.literal(true),
}).openapi("TableConfirmBody");

/** Пакет операций */
export const ApplyTableOpsBodySchema = z.object({
  /** Нужен, если среди операций есть удаление */
  confirm: z.boolean().optional(),
  /** До 50 операций */
  ops: z.array(z.record(z.string(), z.unknown())).min(1).max(50),
}).openapi("ApplyTableOpsBody");

/** Ответ пакета при ошибке */
export const ApplyTableOpsErrorSchema = z.object({
  /** Текст */
  message: z.string(),
  /** Индекс операции, пакет откатан */
  failed_op_index: z.number().int(),
}).openapi("ApplyTableOpsError");
