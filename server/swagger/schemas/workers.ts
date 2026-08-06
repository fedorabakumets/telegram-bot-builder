/**
 * @fileoverview OpenAPI-схемы Worker Pool (/api/workers/stats)
 * @module server/swagger/schemas/workers
 */

import "./common";
import { z } from "zod";

/** Детализация одного Python-воркера проекта */
export const WorkerPoolDetailSchema = z
  .object({
    /** ID проекта (1 проект = 1 воркер-процесс) */
    projectId: z.number().int().openapi({ example: 266, description: "ID проекта bot_projects" }),
    /** Число активных ботов внутри воркера */
    botsCount: z.number().int().openapi({ example: 2, description: "Сколько tokenId сейчас в activeBots воркера" }),
    /** Потребление RAM процесса воркера в МБ (оценка через tasklist/ps) */
    memoryMb: z.number().int().openapi({ example: 72, description: "RSS процесса Python worker, округлённо в МБ" }),
  })
  .openapi("WorkerPoolDetail");

/** Ответ GET /api/workers/stats */
export const WorkerPoolStatsSchema = z
  .object({
    /** Количество активных воркеров (проектов с запущенным worker.py) */
    workers: z.number().int().openapi({ example: 2 }),
    /** Суммарное число ботов во всех воркерах владельца */
    totalBots: z.number().int().openapi({ example: 3 }),
    /** Суммарная RAM всех воркеров владельца, МБ */
    totalMemoryMb: z.number().int().openapi({ example: 145 }),
    /** Разбивка по проектам (без pid и без чужих проектов) */
    details: z.array(WorkerPoolDetailSchema).openapi({
      example: [
        { projectId: 266, botsCount: 1, memoryMb: 72 },
        { projectId: 42, botsCount: 2, memoryMb: 73 },
      ],
    }),
  })
  .openapi("WorkerPoolStats");

/** Пустой ответ — нет активных воркеров или воркер pool отключён */
export const WorkerPoolStatsEmptySchema = z
  .object({
    workers: z.literal(0),
    totalBots: z.literal(0),
    totalMemoryMb: z.literal(0),
    details: z.array(WorkerPoolDetailSchema).max(0).openapi({ example: [] }),
  })
  .openapi("WorkerPoolStatsEmpty");

/** Ошибка GET /api/workers/stats */
export const WorkerStatsErrorSchema = z
  .object({
    /** Текст ошибки */
    message: z.string().openapi({ example: "Не удалось получить статистику воркеров" }),
  })
  .openapi("WorkerStatsError");
