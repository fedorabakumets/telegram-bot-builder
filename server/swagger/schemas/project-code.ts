/**
 * @fileoverview OpenAPI-схемы generate/export Python-кода проекта.
 * @module server/swagger/schemas/project-code
 */

import "./common";
import { z } from "zod";

/** Path `id` для generate / export */
export const ProjectCodeIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/**
 * Тело POST /api/projects/{id}/generate.
 * Флаги токена (catchAllHandlers, protectContent, contentCache) и media
 * file_ids подтягиваются на сервере, в body не передаются.
 */
export const GenerateCodeRequestSchema = z
  .object({
    /** Включить user DB в сгенерированном коде */
    userDatabaseEnabled: z.boolean().optional().openapi({ example: true }),
    /** Включить подробное логирование в коде бота */
    enableLogging: z.boolean().optional().openapi({ example: false }),
  })
  .openapi("GenerateCodeRequest");

/** Успех POST …/generate */
export const GenerateCodeResponseSchema = z
  .object({
    /** Исходный Python-код бота */
    code: z.string().openapi({ example: "import asyncio\n..." }),
    /** Число строк в code */
    lines: z.number().int().openapi({ example: 2157 }),
    /** Unix timestamp генерации (ms) */
    generatedAt: z.number().openapi({ example: 1723392000000 }),
  })
  .openapi("GenerateCodeResponse");

/** Ошибка generate (404 / 500) */
export const GenerateCodeErrorSchema = z
  .object({
    /** Код ошибки */
    error: z.string().openapi({ example: "Project not found" }),
    /** Человекочитаемое сообщение */
    message: z.string().openapi({ example: "Project 42 not found" }),
  })
  .openapi("GenerateCodeError");

/** Успех POST …/export — только `{ code }` */
export const ExportCodeResponseSchema = z
  .object({
    /** Python-код бота */
    code: z.string().openapi({ example: "import asyncio\n..." }),
  })
  .openapi("ExportCodeResponse");

/** Ошибка export */
export const ExportCodeErrorSchema = z
  .object({
    /** Сообщение об ошибке */
    message: z.string().openapi({ example: "Проект не найден" }),
    /** Детали (опционально, при 500) */
    error: z.string().optional(),
  })
  .openapi("ExportCodeError");
