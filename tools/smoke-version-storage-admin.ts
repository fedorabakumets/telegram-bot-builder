/**
 * @fileoverview Проверяет настройку и продолжимый перенос версии PostgreSQL в Silo.
 */
import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { botProjects, projectVersions } from '@shared/schema';
import { db, pool } from '../server/database/db';
import { DatabaseStorage } from '../server/database/DatabaseStorage';
import { getVersionStorageSettings, saveVersionStorageSettings } from '../server/database/version-storage-settings';
import { enqueueVersionMigrationBatch, finishVersionMigration, requestVersionMigration } from '../server/database/version-storage-migration';
import { processPendingVersions, readVersionObject, processVersionObjectDeletions } from '../server/database/version-object-store';

/**
 * Проверяет оба режима записи на одном временном проекте.
 * @returns Завершение проверки
 */
async function main(): Promise<void> {
  const original = await getVersionStorageSettings();
  if (!original.storageId) throw new Error('Для проверки требуется локальное Silo');
  const [project] = await db.insert(botProjects).values({ name: '__version_storage_admin_smoke__', data: {} }).returning();
  try {
    await saveVersionStorageSettings({ mode: 'postgres', storageId: original.storageId });
    const version = await new DatabaseStorage().createProjectVersion(project.id, { sheets: [] }, 'Проверка');
    if (version.snapshotState !== 'postgres' || version.snapshot === null) throw new Error('Версия не сохранена в PostgreSQL');
    await saveVersionStorageSettings({ mode: 's3', storageId: original.storageId });
    await requestVersionMigration();
    if (await enqueueVersionMigrationBatch(10) < 1) throw new Error('Версия не поставлена в очередь');
    await processPendingVersions(10);
    const [stored] = await db.select().from(projectVersions).where(eq(projectVersions.id, version.id));
    if (stored.snapshotState !== 'ready' || stored.snapshot !== null) throw new Error('Версия не перенесена в S3');
    const restored = await readVersionObject(stored) as { sheets: unknown[] };
    if (!Array.isArray(restored.sheets) || restored.sheets.length !== 0) throw new Error('Снимок после переноса изменился');
    await finishVersionMigration();
    /** Новая версия в режиме S3 сразу получает объект и не сохраняет JSONB. */
    const direct = await new DatabaseStorage().createProjectVersion(project.id,
      { sheets: [{ id: 'direct', nodes: [], edges: [] }] }, 'Прямая запись');
    const [directStored] = await db.select().from(projectVersions).where(eq(projectVersions.id, direct.id));
    if (directStored.snapshotState !== 'ready' || directStored.snapshot !== null || !directStored.snapshotKey) {
      throw new Error('Новая версия не записана непосредственно в S3');
    }
    const directSnapshot = await readVersionObject(directStored) as { sheets: Array<{ id: string }> };
    if (directSnapshot.sheets[0]?.id !== 'direct') throw new Error('Прямой снимок S3 изменился');
    /** Сбой S3 сохраняет версию в PostgreSQL для безопасного повтора. */
    await saveVersionStorageSettings({ mode: 's3', storageId: '__unavailable_s3__' });
    const fallback = await new DatabaseStorage().createProjectVersion(project.id,
      { sheets: [{ id: 'fallback' }] }, 'Недоступный S3');
    if (fallback.snapshotState !== 'pending' || fallback.snapshot === null) {
      throw new Error('Ошибка S3 не сохранила резервный снимок в PostgreSQL');
    }
    const invalid = await db.select().from(projectVersions)
      .where(and(eq(projectVersions.projectId, project.id), eq(projectVersions.label, 'Недоступный S3')));
    if (invalid.length !== 1 || invalid[0].snapshot === null || invalid[0].snapshotKey) {
      throw new Error('Резервная версия после сбоя S3 недоступна');
    }
    console.log('PostgreSQL → перенос → Silo; прямая запись S3; резервная запись при сбое: успешно');
  } finally {
    await saveVersionStorageSettings(original);
    await db.delete(botProjects).where(eq(botProjects.id, project.id));
    await processVersionObjectDeletions(20, 0);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await pool.end(); process.exit(process.exitCode ?? 0); });
