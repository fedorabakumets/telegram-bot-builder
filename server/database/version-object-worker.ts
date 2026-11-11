/**
 * @fileoverview Периодическая выгрузка ожидающих снимков и удаление объектов S3.
 */
import { processPendingVersions, processVersionObjectDeletions } from './version-object-store';
import { reconcileAllVersionObjects } from './version-object-reconcile-all';
import { getVersionStorageSettings } from './version-storage-settings';
import { enqueueVersionMigrationBatch, finishVersionMigration, isVersionMigrationRequested } from './version-storage-migration';

/** Защищает от наложения двух циклов обработки. */
let running = false;
/** Последняя полная сверка бакета. */
let lastReconcile = 0;

/**
 * Выполняет один цикл обработки с повтором при следующем тике после ошибки.
 * @returns Завершение цикла
 */
export async function runVersionObjectWorkerOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const settings = await getVersionStorageSettings();
    if (settings.mode === 's3' && settings.storageId) {
      if (await isVersionMigrationRequested() && await enqueueVersionMigrationBatch() === 0) {
        await finishVersionMigration();
      }
      await processPendingVersions();
    }
    await processVersionObjectDeletions();
    if (Date.now() - lastReconcile > 24 * 60 * 60 * 1000) {
      await reconcileAllVersionObjects();
      lastReconcile = Date.now();
    }
  } catch (error) {
    console.error('[VersionObjectWorker] Ошибка обработки снимков:', error);
  } finally { running = false; }
}

/**
 * Запускает фоновый цикл только в роли API.
 * @returns Ничего
 */
export function startVersionObjectWorker(): void {
  void runVersionObjectWorkerOnce();
  const timer = setInterval(() => void runVersionObjectWorkerOnce(), 15_000);
  timer.unref();
}
