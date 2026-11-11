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
/** Пауза после пустых циклов, ограниченная временем обнаружения новых заданий. */
let nextDelay = 2_000;
/** Признак запуска планировщика, исключающий повторный старт. */
let started = false;

/**
 * Выполняет один цикл обработки с повтором при следующем тике после ошибки.
 * @returns Завершение цикла
 */
export async function runVersionObjectWorkerOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    let processed = 0;
    const settings = await getVersionStorageSettings();
    if (settings.mode === 's3' && settings.storageId) {
      if (await isVersionMigrationRequested()) {
        const queued = await enqueueVersionMigrationBatch();
        processed += queued;
        if (queued === 0) await finishVersionMigration();
      }
      processed += await processPendingVersions(50, 10);
    }
    processed += await processVersionObjectDeletions();
    if (Date.now() - lastReconcile > 24 * 60 * 60 * 1000) {
      await reconcileAllVersionObjects();
      lastReconcile = Date.now();
    }
    nextDelay = processed > 0 ? 2_000 : Math.min(nextDelay * 2, 30_000);
  } catch (error) {
    nextDelay = Math.min(nextDelay * 2, 30_000);
    console.error('[VersionObjectWorker] Ошибка обработки снимков:', error);
  } finally { running = false; }
}

/**
 * Запускает фоновый цикл только в роли API.
 * @returns Ничего
 */
export function startVersionObjectWorker(): void {
  if (started) return;
  started = true;
  void scheduleNextCycle();
}

/**
 * Планирует следующий запуск после завершения текущего, сохраняя очередь в БД.
 * @returns Завершение текущего цикла и установки таймера
 */
async function scheduleNextCycle(): Promise<void> {
  await runVersionObjectWorkerOnce();
  const timer = setTimeout(() => void scheduleNextCycle(), nextDelay);
  timer.unref();
}
