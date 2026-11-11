/**
 * @fileoverview Проверяет жизненный цикл версии на временном проекте и локальном S3.
 */
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import { eq } from 'drizzle-orm';
import { botProjects, projectVersions } from '@shared/schema';
import { db, pool } from '../server/database/db';
import { readVersionObject, uploadPendingVersion, processVersionObjectDeletions,
  resolveVersionBackend } from '../server/database/version-object-store';
import { diffNodes } from '../client/components/editor/versions/version-diff';
import { restoreProjectVersionHandler } from '../server/routes/projectRoutes/handlers/restoreProjectVersionHandler';
import type { Request, Response } from 'express';

/**
 * Создаёт, читает, восстанавливает и удаляет временный проект.
 * @returns Завершение проверки
 */
async function main(): Promise<void> {
  const original = { sheets: [{ id: 'smoke', nodes: [{ id: 'one', type: 'message' }], edges: [] }] };
  const [project] = await db.insert(botProjects).values({ name: '__s3_version_smoke__', data: original }).returning();
  try {
    const [version] = await db.insert(projectVersions).values({ projectId: project.id, snapshot: original,
      label: 'Проверка S3', kind: 'manual', snapshotState: 'pending',
      snapshotStorageId: '__unavailable_s3__' }).returning();
    /** При недоступном конфиге JSONB остаётся доступным для повтора. */
    try { await uploadPendingVersion(version); throw new Error('Сбой S3 не был обнаружен'); }
    catch (error) { if ((error as Error).message === 'Сбой S3 не был обнаружен') throw error; }
    await db.update(projectVersions).set({ snapshotStorageId: process.env.VERSION_SNAPSHOT_STORAGE_ID })
      .where(eq(projectVersions.id, version.id));
    const [pending] = await db.select().from(projectVersions).where(eq(projectVersions.id, version.id));
    if (pending.snapshot === null) throw new Error('Снимок потерян после сбоя S3');
    await uploadPendingVersion(pending);
    const [stored] = await db.select().from(projectVersions).where(eq(projectVersions.id, version.id));
    if (stored.snapshot !== null || stored.snapshotState !== 'ready') throw new Error('JSONB не очищен после загрузки');
    const restored = await readVersionObject(stored);
    if (!isDeepStrictEqual(restored, original)) throw new Error('Восстановленный JSON отличается');
    const comparison = diffNodes(restored, original);
    if (comparison.added.length || comparison.removed.length || comparison.changed.length) {
      throw new Error('Сравнение снимка обнаружило ложные изменения');
    }
    await db.update(botProjects).set({ data: { sheets: [] } }).where(eq(botProjects.id, project.id));
    /** Восстановление проходит через реальный HTTP-обработчик на временном проекте. */
    let status = 200;
    const response = { status(code: number) { status = code; return this; }, json(_body: unknown) { return this; } };
    await restoreProjectVersionHandler({ params: { id: String(project.id), versionId: String(version.id) },
      body: {} } as unknown as Request, response as unknown as Response);
    if (status !== 200) throw new Error(`Обработчик восстановления вернул ${status}`);
    const [restoredProject] = await db.select({ data: botProjects.data }).from(botProjects).where(eq(botProjects.id, project.id));
    if (!isDeepStrictEqual(restoredProject.data, original)) throw new Error('Обработчик не восстановил проект');
    /** Вторая версия проверяет запуск фоновой очереди в работающем API. */
    const [asyncVersion] = await db.insert(projectVersions).values({ projectId: project.id,
      snapshot: original, label: 'Проверка фоновой очереди', kind: 'manual', snapshotState: 'pending',
      snapshotStorageId: process.env.VERSION_SNAPSHOT_STORAGE_ID }).returning({ id: projectVersions.id });
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const [row] = await db.select({ state: projectVersions.snapshotState }).from(projectVersions)
        .where(eq(projectVersions.id, asyncVersion.id));
      if (row?.state === 'ready') { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error('Фоновая очередь не перенесла новую версию за 30 секунд');
    const [objectRow] = await db.select().from(projectVersions).where(eq(projectVersions.id, asyncVersion.id));
    await (await resolveVersionBackend(objectRow.snapshotStorageId)).delete(objectRow.snapshotKey!);
    try { await readVersionObject(objectRow); throw new Error('Отсутствующий объект не обнаружен'); }
    catch (error) { if ((error as Error).message === 'Отсутствующий объект не обнаружен') throw error; }
    status = 200;
    await restoreProjectVersionHandler({ params: { id: String(project.id), versionId: String(asyncVersion.id) },
      body: {} } as unknown as Request, response as unknown as Response);
    if (status !== 503) throw new Error('Откат с отсутствующим объектом не был остановлен');
    const [unchanged] = await db.select({ data: botProjects.data }).from(botProjects).where(eq(botProjects.id, project.id));
    if (!isDeepStrictEqual(unchanged.data, original)) throw new Error('Ошибка S3 изменила проект');
    console.log(`Создание, сравнение, восстановление и фоновой перенос проекта ${project.id} прошли`);
  } finally {
    await db.delete(botProjects).where(eq(botProjects.id, project.id));
    await processVersionObjectDeletions(20, 0);
  }
}

main().catch(error => { console.error('Проверка не прошла:', error.message); process.exitCode = 1; })
  .finally(async () => { await pool.end(); process.exit(process.exitCode ?? 0); });
