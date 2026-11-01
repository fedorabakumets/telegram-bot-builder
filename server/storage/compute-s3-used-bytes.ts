/** @fileoverview Подсчёт объёма файлов проекта в S3 отдельно от локальной квоты. */
import { and, eq, sql } from 'drizzle-orm';
import { mediaFiles } from '@shared/schema';
import { db } from '../database/db';

/**
 * Суммирует известные размеры файлов проекта, сохранённых в S3.
 * @param projectId - Идентификатор проекта
 * @returns Занятый объём в байтах; файлы только в Telegram не учитываются
 */
export async function computeS3UsedBytes(projectId: number): Promise<number> {
  const [row] = await db.select({ total: sql<string>`coalesce(sum(${mediaFiles.fileSize}), 0)` })
    .from(mediaFiles)
    .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.storageBackend, 's3')));
  const total = Number(row?.total ?? 0);
  return Number.isFinite(total) && total > 0 ? total : 0;
}
