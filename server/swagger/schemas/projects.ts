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

/** Элемент списка проектов (без botToken и sessionId) */
export const ProjectListItemSchema = z
  .object({
    /** ID проекта */
    id: z.number().openapi({ example: 42 }),
    /** ID владельца */
    ownerId: z.number().nullable().openapi({ example: 123456789 }),
    /** Название */
    name: z.string().openapi({ example: "Мой бот" }),
    /** Описание */
    description: z.string().nullable().openapi({ example: "Приветственный бот" }),
    /** Флаг user DB (0/1) */
    userDatabaseEnabled: z.number().nullable().optional(),
    /** Порядок в списке */
    sortOrder: z.number().nullable().optional(),
    /** ID администраторов через запятую */
    adminIds: z.string().nullable().optional(),
    /** Дата создания */
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Дата обновления */
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Метаданные экспорта в Google Sheets */
    lastExportedGoogleSheetId: z.string().nullable().optional(),
    lastExportedGoogleSheetUrl: z.string().nullable().optional(),
    lastExportedAt: z.union([z.string(), z.date()]).nullable().optional(),
    lastExportedStructureSheetId: z.string().nullable().optional(),
    lastExportedStructureSheetUrl: z.string().nullable().optional(),
    lastExportedStructureAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Количество узлов на всех листах */
    nodeCount: z.number().openapi({ example: 12 }),
    /** Количество листов */
    sheetsCount: z.number().openapi({ example: 2 }),
  })
  .openapi("ProjectListItem");

/** Ответ GET /api/projects/list */
export const ProjectListSchema = z.array(ProjectListItemSchema).openapi("ProjectList");

/** Тело PUT /api/projects/{id} (частичное обновление) */
export const UpdateProjectRequestSchema = insertBotProjectSchema
  .partial()
  .omit({ ownerId: true, sessionId: true })
  .extend({
    /** Заметка к ручному чекпоинту версии */
    commitMessage: z.string().optional().openapi({ example: "Добавил приветствие" }),
    /** Правка от MCP-агента (live canvas) */
    agentEdit: z.boolean().optional(),
    /** ID сессии агента для canvas-sync */
    agentSessionId: z.string().optional(),
    /** Отображаемое имя агента */
    agentDisplayName: z.string().optional(),
    /** Перезапустить бота после обновления data */
    restartOnUpdate: z.boolean().optional(),
  })
  .openapi("UpdateProjectRequest");

/** Тело POST /api/projects/{id}/duplicate */
export const DuplicateProjectRequestSchema = z
  .object({
    /** Имя копии (по умолчанию «{имя} (копия)») */
    name: z.string().optional().openapi({ example: "Мой бот (копия)" }),
  })
  .openapi("DuplicateProjectRequest");

/** Метаданные версии проекта (без snapshot) */
export const ProjectVersionMetaSchema = z
  .object({
    /** ID версии */
    id: z.number().openapi({ example: 7 }),
    /** ID проекта */
    projectId: z.number().openapi({ example: 42 }),
    /** Метка версии */
    label: z.string().nullable().optional(),
    /** ID автора */
    authorId: z.number().nullable().optional(),
    /** Имя автора или «ИИ-агент» */
    authorName: z.string().optional(),
    /** Тип автора: agent — MCP */
    authorKind: z.string().nullable().optional(),
    /** auto — авто-снимок, manual — чекпоинт */
    kind: z.enum(["auto", "manual"]).optional(),
    /** Дата создания */
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("ProjectVersionMeta");

/** Ответ GET /api/projects/{id}/versions */
export const ProjectVersionListSchema = z
  .array(ProjectVersionMetaSchema)
  .openapi("ProjectVersionList");

/** Ответ DELETE /api/projects/{id} */
export const DeleteProjectResponseSchema = z
  .object({
    /** Сообщение об успешном удалении */
    message: z.string().openapi({ example: "Проект успешно удалён" }),
  })
  .openapi("DeleteProjectResponse");
