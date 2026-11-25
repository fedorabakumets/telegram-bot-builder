/** @fileoverview Свежие настройки запуска и сброс кэша после изменения проекта. */
import { eq } from 'drizzle-orm';
import { cachedOps } from '../database/db-cache';

/**
 * Читает проект для запуска напрямую, обходя локальные кэши других экземпляров API.
 * @param projectId - Идентификатор проекта.
 * @returns Актуальный проект либо отсутствие записи.
 */
export async function readProjectForLaunch(projectId: number) {
  /** Подключение к БД требуется только при подготовке запуска. */
  const { botProjects } = await import('@shared/schema');
  const { db } = await import('../database/db');
  const [project] = await db.select().from(botProjects).where(eq(botProjects.id, projectId));
  return project;
}

/**
 * Сбрасывает локальный кэш после завершения записи, включая неоднозначную ошибку commit.
 * @param projectId - Идентификатор проекта.
 * @param write - Запись с ожиданием завершения транзакции.
 * @returns Результат записи без изменения исходной ошибки.
 */
export async function withProjectSettingsInvalidation<T>(projectId: number, write: () => Promise<T>): Promise<T> {
  try { return await write(); }
  finally { cachedOps.invalidateProject(projectId); }
}
