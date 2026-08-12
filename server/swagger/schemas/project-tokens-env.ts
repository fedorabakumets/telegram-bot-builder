/**
 * @fileoverview Схемы env-variables / env-batch токена проекта.
 * @module server/swagger/schemas/project-tokens-env
 */

import "./common";
import { z } from "zod";

/** Одна переменная env (в списке секреты маскируются) */
export const ProjectTokenEnvVariableSchema = z
  .object({
    /** ID записи */
    id: z.number().int().openapi({ example: 15 }),
    /** ID токена */
    tokenId: z.number().int().openapi({ example: 7 }),
    /** KEY */
    key: z.string().openapi({ example: "API_KEY" }),
    /** Значение или •••••••• */
    value: z.string().openapi({ example: "••••••••" }),
    /** Секрет 0/1 */
    isSecret: z.number().nullable().optional().openapi({ example: 1 }),
    /** Создана */
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    /** Обновлена */
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("ProjectTokenEnvVariable");

/** Ответ GET env-variables */
export const ProjectTokenEnvListSchema = z
  .object({
    /** Список */
    items: z.array(ProjectTokenEnvVariableSchema),
    /** Количество */
    count: z.number().int().openapi({ example: 1 }),
  })
  .openapi("ProjectTokenEnvList");

/** Тело POST env-variables */
export const ProjectTokenEnvCreateBodySchema = z
  .object({
    /** KEY: ^[A-Z][A-Z0-9_]*$ */
    key: z.string().openapi({ example: "API_KEY" }),
    /** Значение */
    value: z.string().optional().openapi({ example: "secret" }),
    /** Секрет 0/1 */
    isSecret: z.number().optional().openapi({ example: 1 }),
  })
  .openapi("ProjectTokenEnvCreateBody");

/** Тело PUT env-variables/:id */
export const ProjectTokenEnvUpdateBodySchema = z
  .object({
    /** Новый KEY */
    key: z.string().optional(),
    /** Новое значение */
    value: z.string().optional(),
    /** Секрет 0/1 */
    isSecret: z.number().optional(),
  })
  .openapi("ProjectTokenEnvUpdateBody");

/** Один change в env-batch */
export const ProjectTokenEnvBatchChangeSchema = z
  .object({
    /** create | update | delete */
    action: z.string().openapi({ example: "update" }),
    /** KEY (BOT_TOKEN, ADMIN_IDS, LOG_LEVEL, …) */
    key: z.string().openapi({ example: "LOG_LEVEL" }),
    /** Значение */
    value: z.string().optional().openapi({ example: "WARNING" }),
    /** ID для delete/update кастомной */
    id: z.number().int().optional(),
    /** isSecret при create */
    isSecret: z.number().optional(),
  })
  .openapi("ProjectTokenEnvBatchChange");

/** Тело PUT env-batch */
export const ProjectTokenEnvBatchRequestSchema = z
  .object({
    /** Массив изменений (обязателен, не пустой) */
    changes: z.array(ProjectTokenEnvBatchChangeSchema).min(1),
  })
  .openapi("ProjectTokenEnvBatchRequest");

/** Ответ env-batch */
export const ProjectTokenEnvBatchResponseSchema = z
  .object({
    /** Успех */
    success: z.literal(true),
    /** Сколько результатов (включая skipped) */
    applied: z.number().int().openapi({ example: 2 }),
    /**
     * Строки вида `updated:LOG_LEVEL` или `skipped:BOT_TOKEN:masked`
     * (маска из GET не перезаписывает реальный token в БД)
     */
    results: z.array(z.string()).openapi({
      example: ["updated:LOG_LEVEL", "skipped:BOT_TOKEN:masked"],
    }),
  })
  .openapi("ProjectTokenEnvBatchResponse");

/** Успех DELETE env */
export const ProjectTokenEnvDeleteResponseSchema = z
  .object({ success: z.literal(true) })
  .openapi("ProjectTokenEnvDeleteResponse");
