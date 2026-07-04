/**
 * @fileoverview Middleware проверки владения медиафайлом по :id в пути.
 * Резолвит media_files.id → его projectId и проверяет доступ владельца/коллаборатора
 * (закрывает IDOR на маршрутах вида /api/media/:id/*). Личность гарантирована
 * вышестоящим requireApiAuth.
 * @module middleware/requireMediaFileOwnership
 */

import type { Request } from "express";
import { eq } from "drizzle-orm";

import { db } from "../database/db";
import { mediaFiles } from "@shared/schema";
import { requireResourceOwnership } from "./requireResourceOwnership";

/**
 * Резолвит projectId медиафайла по числовому :id из пути.
 * @param req - Запрос с параметром id
 * @returns projectId медиафайла или null, если файл не найден/некорректен
 */
async function resolveProjectIdByMediaParam(req: Request): Promise<number | null> {
  const mediaFileId = parseInt(req.params.id, 10);
  if (Number.isNaN(mediaFileId)) {
    return null;
  }
  const [file] = await db
    .select({ projectId: mediaFiles.projectId })
    .from(mediaFiles)
    .where(eq(mediaFiles.id, mediaFileId));
  return file ? file.projectId : null;
}

/**
 * Middleware проверки владения медиафайлом по :id в пути.
 * Резолвит файл → его projectId → доступ владельца/коллаборатора.
 */
export const requireMediaFileOwnership = requireResourceOwnership(
  resolveProjectIdByMediaParam,
  "Медиафайл не найден",
);
