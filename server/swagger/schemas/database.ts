/**
 * @fileoverview OpenAPI-схемы пользовательских таблиц проекта (Bot Tables).
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
    createdAt: z
      .union([z.string(), z.date()])
      .nullable()
      .optional()
      .openapi({ example: "2026-08-01T10:00:00.000Z" }),
  })
  .openapi("BotTable");

/** Ответ GET /api/projects/{id}/tables */
export const BotTableListSchema = z.array(BotTableSchema).openapi("BotTableList");

/** Path: ID проекта */
export const DatabaseProjectIdParamsSchema = z.object({
  id: z.string().openapi({
    example: "42",
    description: "ID проекта bot_projects",
    param: {
      description: "ID проекта bot_projects",
      example: "42",
    },
  }),
});

/** Session cookie (или Bearer PAT) */
export const DatabaseCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description:
        "Session cookie. Не нужна при Bearer PAT. Без обоих — 401.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});
