/**
 * @fileoverview OpenAPI-схемы projects-эндпоинтов
 * @module server/swagger/schemas/projects
 */

import { insertBotProjectSchema } from "@shared/schema";
import "./common";
import { z } from "zod";

/** Тело POST /api/projects (ownerId задаётся из сессии) */
export const CreateProjectRequestSchema = insertBotProjectSchema
  .omit({
    ownerId: true,
    lastExportedGoogleSheetId: true,
    lastExportedGoogleSheetUrl: true,
    lastExportedAt: true,
    lastExportedStructureSheetId: true,
    lastExportedStructureSheetUrl: true,
    lastExportedStructureAt: true,
    sessionId: true,
  })
  .openapi("CreateProjectRequest", {
    example: {
      name: "Мой бот",
      description: "Приветственный бот",
      data: { sheets: [{ id: "main", nodes: [], edges: [] }] },
      userDatabaseEnabled: 1,
      sortOrder: 0,
    },
  });

/** Ответ с данными проекта */
export const BotProjectSchema = z
  .object({
    /** ID проекта */
    id: z.number().openapi({ example: 42 }),
    /** ID владельца */
    ownerId: z.number().nullable().openapi({ example: 123456789 }),
    /** Название */
    name: z.string().openapi({ example: "Мой бот" }),
    /** Описание */
    description: z.string().nullable().optional(),
    /** JSON проекта (nodes, edges, sheets) */
    data: z.unknown().openapi({ example: { sheets: [] } }),
    /** Токен бота (может быть null) */
    botToken: z.string().nullable().optional(),
    /** Включена ли user DB */
    userDatabaseEnabled: z.number().optional(),
    /** Порядок в списке */
    sortOrder: z.number().optional(),
    /** Дата создания */
    createdAt: z.union([z.string(), z.date()]).optional(),
    /** Дата обновления */
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .openapi("BotProject");

/** Ответ при отсутствии авторизации на create */
export const CreateProjectUnauthorizedSchema = z
  .object({
    message: z.string().openapi({ example: "Требуется авторизация через Telegram" }),
  })
  .openapi("CreateProjectUnauthorized");
