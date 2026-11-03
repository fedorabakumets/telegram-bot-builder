/**
 * @fileoverview Запрос списка медиа с учётом выбранного S3-хранилища.
 * @module server/routes/media/selected-media-list
 */
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { mediaFiles } from "@shared/schema";
import { db } from "../../database/db";
import { selectedMediaStorageId } from "../../storage/selected-media-storage";

/**
 * Загружает медиа проекта и фильтрует по выбранному S3 до выдачи.
 * @param projectId - Идентификатор проекта
 * @param type - Необязательный тип файла
 * @param search - Необязательный фрагмент имени
 * @returns Записи медиа проекта
 */
export async function listSelectedMedia(projectId: number, type?: string, search?: string) {
  const selected = await selectedMediaStorageId();
  const conditions = [eq(mediaFiles.projectId, projectId)];
  if (selected) conditions.push(eq(mediaFiles.storageConfigId, selected));
  if (type) conditions.push(eq(mediaFiles.fileType, type));
  if (search) {
    const match = or(ilike(mediaFiles.fileName, `%${search}%`), ilike(mediaFiles.description, `%${search}%`));
    if (match) conditions.push(match);
  }
  const query = db.select().from(mediaFiles).where(and(...conditions));
  return search ? query.orderBy(desc(mediaFiles.usageCount), desc(mediaFiles.createdAt)) : query.orderBy(desc(mediaFiles.createdAt));
}
