/**
 * @fileoverview OpenAPI-схемы строк bot_table_rows и Success.
 * @module server/swagger/schemas/project-tables-rows
 */

import "./common";
import { z } from "zod";

/** Строка пользовательской таблицы */
export const BotTableRowSchema = z
  .object({
    /** ID строки */
    id: z.number().openapi({ example: 10 }),
    /** ID таблицы */
    tableId: z.number().openapi({ example: 1 }),
    /** Индекс строки */
    rowIndex: z.number().int().openapi({ example: 0 }),
    /** Данные ячеек (ключ — id колонки или имя) */
    data: z
      .record(z.string(), z.string())
      .openapi({ example: { "3": "100", "4": "Товар A" } }),
  })
  .openapi("BotTableRow");

/** Ответ GET …/rows */
export const BotTableRowListSchema = z
  .array(BotTableRowSchema)
  .openapi("BotTableRowList");

/** Элемент массива rows при создании */
export const CreateBotTableRowItemSchema = z.object({
  /** Индекс строки (иначе — индекс в массиве) */
  rowIndex: z.number().int().optional().openapi({ example: 0 }),
  /** Данные ячеек */
  data: z
    .record(z.string(), z.string())
    .optional()
    .openapi({ example: { "3": "100" } }),
});

/** Тело POST …/rows (батч, непустой) */
export const CreateBotTableRowsBodySchema = z
  .object({
    /** Массив строк для вставки */
    rows: z
      .array(CreateBotTableRowItemSchema)
      .min(1)
      .openapi({ example: [{ rowIndex: 0, data: { "3": "100" } }] }),
  })
  .openapi("CreateBotTableRowsBody");

/** Тело PUT …/rows/{rowId} */
export const UpdateBotTableRowBodySchema = z
  .object({
    /** Новые данные ячеек (объект) */
    data: z
      .record(z.string(), z.string())
      .openapi({ example: { "3": "150", "4": "Товар A" } }),
  })
  .openapi("UpdateBotTableRowBody");

/** Успех delete / reindex: `{ success: true }` */
export const TablesSuccessSchema = z
  .object({
    /** Операция выполнена */
    success: z.literal(true).openapi({ example: true }),
  })
  .openapi("TablesSuccess");
