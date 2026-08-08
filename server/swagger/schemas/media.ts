/**
 * @fileoverview OpenAPI-схемы медиафайлов проекта.
 * @module server/swagger/schemas/media
 */

import "./common";
import { z } from "zod";

/** DTO media_files (без внутренних путей при желании — url наружу ок) */
export const MediaFileDtoSchema = z
  .object({
    id: z.number().int().openapi({ example: 10 }),
    projectId: z.number().int().openapi({ example: 42 }),
    fileName: z.string().openapi({ example: "photo.jpg" }),
    fileType: z.string().openapi({ example: "photo" }),
    filePath: z.string().optional(),
    fileSize: z.number().int().openapi({ example: 12345 }),
    mimeType: z.string().openapi({ example: "image/jpeg" }),
    url: z.string().openapi({ example: "/uploads/42/photo.jpg" }),
    description: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    isPublic: z.number().int().nullable().optional(),
    usageCount: z.number().int().nullable().optional(),
    telegramFileId: z.string().nullable().optional(),
    thumbnailMediaId: z.number().int().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    storageBackend: z.string().nullable().optional().openapi({ example: "local" }),
    storageConfigId: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("MediaFile");

export const MediaFileListSchema = z.array(MediaFileDtoSchema).openapi("MediaFileList");

export const MediaProjectIdParamsSchema = z.object({
  projectId: z.string().openapi({
    example: "42",
    param: { description: "ID проекта bot_projects", example: "42" },
  }),
});

export const MediaIdParamsSchema = z.object({
  id: z.string().openapi({
    example: "10",
    param: { description: "ID записи media_files", example: "10" },
  }),
});

export const MediaCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description: "Session cookie. Не нужна при Bearer PAT.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

export const MediaErrorSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
    success: z.boolean().optional(),
  })
  .openapi("MediaError");
