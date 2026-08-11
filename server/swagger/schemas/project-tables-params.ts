/**
 * @fileoverview Path-параметры OpenAPI для `/api/projects/…/tables*`.
 * @module server/swagger/schemas/project-tables-params
 */

import "./common";
import { z } from "zod";

/** Path `id` + `tableId` */
export const TableIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "ID проекта bot_projects",
    param: { description: "ID проекта bot_projects", example: "42" },
  }),
  /** Числовой ID таблицы */
  tableId: z.string().openapi({
    example: "1",
    description: "ID таблицы bot_tables",
    param: { description: "ID таблицы bot_tables", example: "1" },
  }),
});

/** Path `id` + `tableId` + `columnId` */
export const ColumnParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "ID проекта bot_projects",
    param: { description: "ID проекта bot_projects", example: "42" },
  }),
  /** Числовой ID таблицы */
  tableId: z.string().openapi({
    example: "1",
    description: "ID таблицы bot_tables",
    param: { description: "ID таблицы bot_tables", example: "1" },
  }),
  /** Числовой ID колонки */
  columnId: z.string().openapi({
    example: "3",
    description: "ID колонки bot_table_columns",
    param: { description: "ID колонки bot_table_columns", example: "3" },
  }),
});

/** Path `id` + `tableId` + `rowId` */
export const RowParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "ID проекта bot_projects",
    param: { description: "ID проекта bot_projects", example: "42" },
  }),
  /** Числовой ID таблицы */
  tableId: z.string().openapi({
    example: "1",
    description: "ID таблицы bot_tables",
    param: { description: "ID таблицы bot_tables", example: "1" },
  }),
  /** Числовой ID строки */
  rowId: z.string().openapi({
    example: "10",
    description: "ID строки bot_table_rows",
    param: { description: "ID строки bot_table_rows", example: "10" },
  }),
});
