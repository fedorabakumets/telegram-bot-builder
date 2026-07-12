/**
 * @fileoverview OpenAPI-схемы пользовательских таблиц проекта (Bot Tables)
 * @module server/swagger/schemas/database
 */

import "./common";
import { z } from "zod";

/** Запись таблицы контента проекта */
export const BotTableSchema = z
  .object({
    /** ID таблицы */
    id: z.number().openapi({ example: 1 }),
    /** ID проекта */
    projectId: z.number().openapi({ example: 42 }),
    /** Название таблицы */
    name: z.string().openapi({ example: "Товары" }),
    /** Дата создания */
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotTable");

/** Ответ GET /api/projects/{id}/tables */
export const BotTableListSchema = z.array(BotTableSchema).openapi("BotTableList");
