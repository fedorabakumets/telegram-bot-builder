/**
 * @fileoverview OpenAPI: системные таблицы logs/all и launches/all.
 * @module server/swagger/schemas/project-system-tables
 */

import "./common";
import { z } from "zod";

/** Path id проекта */
export const SystemTablesProjectIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Query GET …/logs/all */
export const ProjectLogsAllQuerySchema = z.object({
  /** Максимум строк (по умолчанию 200) */
  limit: z.string().optional().openapi({
    example: "200",
    description: "Лимит записей, по умолчанию 200",
    param: { description: "Лимит записей (default 200)", example: "200" },
  }),
  /** Фильтр по токену бота (опционально) */
  tokenId: z.string().optional().openapi({
    example: "7",
    description: "ID токена; без параметра — логи всех токенов проекта",
    param: {
      description: "Опциональный фильтр bot_logs.token_id",
      example: "7",
    },
  }),
});

/** Укороченная строка системной таблицы «Логи» */
export const ProjectSystemLogRowSchema = z
  .object({
    /** Тип строки bot_logs (stdout / stderr / status) */
    level: z.string().openapi({ example: "stdout" }),
    /** Первые 150 символов content */
    message: z.string().openapi({ example: "Bot started successfully" }),
    /** timestamp записи */
    createdAt: z.union([z.string(), z.date()]).openapi({
      example: "2026-08-08T20:00:00.000Z",
    }),
  })
  .openapi("ProjectSystemLogRow");

/** Ответ GET …/logs/all */
export const ProjectSystemLogListSchema = z
  .array(ProjectSystemLogRowSchema)
  .openapi("ProjectSystemLogList");

/** Строка системной таблицы «Запуски» */
export const ProjectSystemLaunchRowSchema = z
  .object({
    /** status записи bot_launch_history */
    status: z.string().openapi({ example: "stopped" }),
    /** Время старта */
    startedAt: z.union([z.string(), z.date()]).nullable().openapi({
      example: "2026-08-08T19:55:00.000Z",
    }),
    /** Время остановки */
    stoppedAt: z.union([z.string(), z.date()]).nullable().openapi({
      example: "2026-08-08T20:10:00.000Z",
    }),
    /** Первые 100 символов error_message */
    errorMessage: z.string().nullable().openapi({ example: null }),
  })
  .openapi("ProjectSystemLaunchRow");

/** Ответ GET …/launches/all (до 100 записей) */
export const ProjectSystemLaunchListSchema = z
  .array(ProjectSystemLaunchRowSchema)
  .openapi("ProjectSystemLaunchList");
