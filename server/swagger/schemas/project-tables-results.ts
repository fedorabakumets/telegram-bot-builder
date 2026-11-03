/** @fileoverview Результаты чтения таблицы и пакета по существующим обработчикам. */
import './common';
import { z } from 'zod';
import { BotTableSchema } from './database';
import { BotTableColumnSchema } from './project-tables-columns';
import { BotTableRowSchema } from './project-tables-rows';
/** Сводка заполненности loadTableSummary. */
export const TableSummarySchema = z.object({
  /** Число строк. */
  rowCount: z.number().int(),
  /** Заполненность столбцов. */
  columns: z.array(z.object({
    /** Идентификатор. */
    id: z.number(),
    /** Имя. */
    name: z.string(),
    /** Порядок. */
    position: z.number().int(),
    /** Число непустых ячеек. */
    filled: z.number().int(),
  })),
}).openapi('TableSummary');
/** Ответ getTableHandler. */
export const TableDetailSchema = z.object({
  /** Таблица проекта. */
  table: BotTableSchema,
  /** Столбцы. */
  columns: z.array(BotTableColumnSchema),
  /** Заполненность. */
  summary: TableSummarySchema,
}).openapi('TableDetail');
/** Ответ applyOpsHandler с вариантами runTableOp. */
export const TableOpsResultSchema = z.object({
  /** Результаты по порядку запроса. */
  results: z.array(z.union([BotTableColumnSchema, BotTableRowSchema, z.array(BotTableRowSchema), z.object({
    /** Подтверждение удаления или переиндексации. */
    ok: z.literal(true),
  })])),
}).openapi('TableOpsResult');
