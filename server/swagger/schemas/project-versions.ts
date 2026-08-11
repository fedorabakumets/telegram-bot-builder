/**
 * @fileoverview OpenAPI-схемы эндпоинтов `/api/projects/{id}/versions*`.
 * @module server/swagger/schemas/project-versions
 */

import "./common";
import { z } from "zod";
import { ProjectVersionMetaSchema } from "./projects";

/** Path `id` проекта */
export const VersionsProjectIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Path `id` + `versionId` */
export const VersionsProjectVersionParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
  /** Числовой ID версии */
  versionId: z.string().openapi({
    example: "7",
    description: "Числовой ID версии",
    param: { description: "Числовой ID версии", example: "7" },
  }),
});

/** Тело POST …/versions/commit */
export const VersionCommitRequestSchema = z
  .object({
    /** Текст чекпоинта (обязателен, не пустой после trim) */
    message: z.string().min(1).openapi({ example: "Добавил приветствие" }),
  })
  .openapi("VersionCommitRequest");

/** Полная запись версии (со snapshot) — GET one / ответ commit */
export const ProjectVersionFullSchema = ProjectVersionMetaSchema.extend({
  /** Снимок `project.data` на момент версии */
  snapshot: z.unknown().openapi({
    example: { sheets: [{ id: "main", name: "Основной", nodes: [], edges: [] }] },
  }),
}).openapi("ProjectVersionFull");

/** Тело POST …/versions/prune */
export const VersionPruneRequestSchema = z
  .object({
    /** Сколько последних версий оставить (остальные удалить) */
    keep: z.number().int().nonnegative().optional().openapi({ example: 30 }),
    /** Фильтр по виду версии */
    kind: z.enum(["auto", "manual"]).optional().openapi({ example: "auto" }),
    /** Фильтр по типу автора */
    authorKind: z.enum(["agent", "user"]).optional().openapi({ example: "agent" }),
  })
  .openapi("VersionPruneRequest");

/** Ответ prune */
export const VersionPruneResponseSchema = z
  .object({
    /** Число удалённых версий */
    deleted: z.number().int().openapi({ example: 12 }),
  })
  .openapi("VersionPruneResponse");

/** Ответ DELETE одной версии */
export const VersionDeleteResponseSchema = z
  .object({
    /** Удалена ли запись */
    deleted: z.boolean().openapi({ example: true }),
  })
  .openapi("VersionDeleteResponse");
