/**
 * @fileoverview OpenAPI-схемы project-files: список, удаление, квота, прокси.
 * @module server/swagger/schemas/project-files
 */

import "./common";
import { z } from "zod";

/** Path projectId */
export const ProjectFilesProjectIdParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
});

/** Query GET …/files */
export const ProjectFilesListQuerySchema = z.object({
  /** Категория: all | incoming | outgoing | uploaded */
  category: z.string().optional().openapi({
    example: "uploaded",
    description: "Категория (или легаси `source`). Обязателен category|source.",
    param: { description: "all | incoming | outgoing | uploaded", example: "uploaded" },
  }),
  /** Легаси-алиас category */
  source: z.string().optional().openapi({
    example: "uploaded",
    description: "Алиас category",
  }),
  /** Подстрока имени файла */
  fileName: z.string().optional().openapi({ example: "photo" }),
  /** ISO начало периода */
  dateFrom: z.string().optional().openapi({ example: "2026-08-01" }),
  /** ISO конец периода */
  dateTo: z.string().optional().openapi({ example: "2026-08-12" }),
  /** Тип медиа или cover */
  mediaType: z.string().optional().openapi({ example: "photo" }),
  /** ID коллаборатора (uploaded) */
  uploadedBy: z.string().optional().openapi({ example: "1001" }),
  /** Мин. размер, байты */
  sizeMin: z.string().optional().openapi({ example: "1024" }),
  /** Макс. размер, байты */
  sizeMax: z.string().optional().openapi({ example: "10485760" }),
  /** ID storage_configs */
  storageConfigId: z.string().optional().openapi({ example: "local-default" }),
  /** Токен бота (для сообщений) */
  tokenId: z.string().optional().openapi({ example: "7" }),
  /** Страница (1..) */
  page: z.string().optional().openapi({ example: "1" }),
  /** Размер страницы (1..100, default 50) */
  limit: z.string().optional().openapi({ example: "50" }),
});

/** Элемент списка файлов (упрощённый DTO) */
export const ProjectFileItemSchema = z
  .object({
    id: z.number().int().openapi({ example: 88 }),
    source: z.enum(["incoming", "outgoing", "uploaded"]).openapi({ example: "uploaded" }),
    mediaType: z.string().nullable().openapi({ example: "photo" }),
    fileId: z.string().nullable().optional().openapi({ example: "AgACAgIAAxkBAA" }),
    fileName: z.string().nullable().optional().openapi({ example: "cover.jpg" }),
    fileSize: z.number().nullable().optional().openapi({ example: 245760 }),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("ProjectFileItem");

/** Ответ GET …/files */
export const ProjectFilesListResponseSchema = z
  .object({
    files: z.array(ProjectFileItemSchema),
    total: z.number().int().openapi({ example: 120 }),
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 50 }),
  })
  .openapi("ProjectFilesListResponse");

/** Элемент DELETE body */
export const ProjectFileDeleteItemSchema = z
  .object({
    id: z.number().int().openapi({ example: 88 }),
    source: z.enum(["incoming", "outgoing", "uploaded"]).openapi({ example: "uploaded" }),
  })
  .openapi("ProjectFileDeleteItem");

/** Тело DELETE …/files */
export const ProjectFilesDeleteRequestSchema = z
  .object({
    items: z.array(ProjectFileDeleteItemSchema).min(1).optional().openapi({
      description: "Предпочтительный формат (вкладка «all»)",
    }),
    ids: z.array(z.number().int()).min(1).optional().openapi({
      description: "Легаси: вместе с source",
    }),
    source: z.enum(["incoming", "outgoing", "uploaded"]).optional(),
  })
  .openapi("ProjectFilesDeleteRequest");

/** Ответ DELETE */
export const ProjectFilesDeleteResponseSchema = z
  .object({
    success: z.literal(true).openapi({ example: true }),
    deleted: z.number().int().openapi({ example: 2 }),
  })
  .openapi("ProjectFilesDeleteResponse");

/** Ответ GET …/storage-quota */
export const StorageQuotaResponseSchema = z
  .object({
    usedBytes: z.number().int().openapi({ example: 52428800 }),
    limitBytes: z.number().int().nullable().openapi({ example: 1073741824 }),
    quotaExceeded: z.boolean().openapi({ example: false }),
  })
  .openapi("StorageQuotaResponse");

/** Query GET …/telegram-file */
export const TelegramFileQuerySchema = z.object({
  /** Telegram file_id */
  fileId: z.string().openapi({
    example: "AgACAgIAAxkBAA",
    description: "file_id из Bot API",
    param: { description: "Telegram file_id", example: "AgACAgIAAxkBAA" },
  }),
  /** Токен бота проекта */
  tokenId: z.string().optional().openapi({
    example: "7",
    param: { description: "ID токена бота", example: "7" },
  }),
  /** Имя для Content-Disposition */
  fileName: z.string().optional().openapi({ example: "photo.jpg" }),
});
