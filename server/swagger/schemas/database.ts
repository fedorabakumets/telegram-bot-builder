/**
 * @fileoverview OpenAPI-схемы пользовательских таблиц проекта (Bot Tables).
 * @module server/swagger/schemas/database
 */

import "./common";
import { z } from "zod";
import {
  ProjectsAuthHeadersSchema,
  ProjectsCookiesSchema,
} from "./projects";

/** Session cookie — алиас ProjectsCookiesSchema */
export const DatabaseCookiesSchema = ProjectsCookiesSchema;

/** Bearer PAT header — алиас ProjectsAuthHeadersSchema */
export const DatabaseAuthHeadersSchema = ProjectsAuthHeadersSchema;

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

/** Тело POST …/tables */
export const CreateBotTableBodySchema = z
  .object({
    /** Название новой таблицы */
    name: z.string().min(1).openapi({ example: "Товары" }),
  })
  .openapi("CreateBotTableBody");

/** Тело PUT …/tables/{tableId} */
export const RenameBotTableBodySchema = z
  .object({
    /** Новое название таблицы */
    name: z.string().min(1).openapi({ example: "Услуги" }),
  })
  .openapi("RenameBotTableBody");
