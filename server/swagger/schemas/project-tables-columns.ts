/**
 * @fileoverview OpenAPI-схемы колонок bot_table_columns.
 * @module server/swagger/schemas/project-tables-columns
 */

import "./common";
import { z } from "zod";

/** Колонка пользовательской таблицы */
export const BotTableColumnSchema = z
  .object({
    /** ID колонки */
    id: z.number().openapi({ example: 3 }),
    /** ID таблицы */
    tableId: z.number().openapi({ example: 1 }),
    /** Название колонки */
    name: z.string().openapi({ example: "Цена" }),
    /** Позиция для сортировки */
    position: z.number().int().openapi({ example: 0 }),
  })
  .openapi("BotTableColumn");

/** Ответ GET …/columns */
export const BotTableColumnListSchema = z
  .array(BotTableColumnSchema)
  .openapi("BotTableColumnList");

/** Тело POST …/columns */
export const CreateBotTableColumnBodySchema = z
  .object({
    /** Название колонки */
    name: z.string().min(1).openapi({ example: "Цена" }),
    /** Позиция (по умолчанию 0) */
    position: z.number().int().optional().openapi({ example: 0 }),
  })
  .openapi("CreateBotTableColumnBody");

/** Тело PUT …/columns/{columnId} */
export const RenameBotTableColumnBodySchema = z
  .object({
    /** Новое название колонки */
    name: z.string().min(1).openapi({ example: "Стоимость" }),
  })
  .openapi("RenameBotTableColumnBody");
