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

/** Ответ с данными проекта (полная запись bot_projects) */
export const BotProjectSchema = z
  .object({
    /** ID проекта */
    id: z.number().openapi({ example: 42 }),
    /** ID владельца Telegram */
    ownerId: z.number().nullable().openapi({ example: 123456789 }),
    /** Название */
    name: z.string().openapi({ example: "Мой бот" }),
    /** Описание */
    description: z.string().nullable().optional().openapi({
      example: "Приветственный бот",
    }),
    /** JSON сценария (sheets / nodes / edges) */
    data: z.unknown().openapi({
      example: { sheets: [{ id: "main", name: "Основной", nodes: [], edges: [] }] },
    }),
    /**
     * Устаревшее поле токена на проекте (часто null).
     * Актуальные токены — в bot_tokens / /api/projects/{id}/tokens.
     */
    botToken: z.string().nullable().optional().openapi({ example: null }),
    /** Сессия гостя (для Studio обычно null) */
    sessionId: z.string().nullable().optional().openapi({ example: null }),
    /** Включена ли user DB (0/1) */
    userDatabaseEnabled: z.number().nullable().optional().openapi({ example: 1 }),
    /** Порядок в списке сайдбара */
    sortOrder: z.number().nullable().optional().openapi({ example: 0 }),
    /** ID админов бота через запятую */
    adminIds: z.string().nullable().optional().openapi({ example: null }),
    /** Дата создания */
    createdAt: z.union([z.string(), z.date()]).nullable().optional().openapi({
      example: "2026-08-01T10:00:00.000Z",
    }),
    /** Дата обновления */
    updatedAt: z.union([z.string(), z.date()]).nullable().optional().openapi({
      example: "2026-08-11T12:00:00.000Z",
    }),
  })
  .openapi("BotProject");

/** Ответ GET /api/projects — массив полных проектов */
export const BotProjectListSchema = z
  .array(BotProjectSchema)
  .openapi("BotProjectList");

/** Session cookie для /api/projects* (или Bearer PAT) */
export const ProjectsCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description:
        "Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie после login. Альтернатива — Authorization: Bearer mcp_…",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

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

/** Тело PUT /api/projects/reorder */
export const ReorderProjectsRequestSchema = z
  .object({
    /**
     * Полный список ID проектов в желаемом порядке.
     * Каждый ID — владелец или collaborator текущего пользователя.
     */
    projectIds: z
      .array(z.number().int().positive())
      .min(1)
      .openapi({ example: [42, 7, 15] }),
  })
  .openapi("ReorderProjectsRequest");

/** Успех PUT /api/projects/reorder */
export const ReorderProjectsResponseSchema = z
  .object({
    /** Признак успеха */
    success: z.literal(true).openapi({ example: true }),
  })
  .openapi("ReorderProjectsResponse");
