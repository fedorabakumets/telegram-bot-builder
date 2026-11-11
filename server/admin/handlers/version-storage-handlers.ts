/**
 * @fileoverview Административный выбор хранилища версий и запуск переноса.
 */
import type { Request, Response } from 'express';
import { pool } from '../../database/db';
import { getVersionStorageSettings, saveVersionStorageSettings } from '../../database/version-storage-settings';
import { getVersionStorageCounts, isVersionMigrationRequested, requestVersionMigration } from '../../database/version-storage-migration';
import { verifyVersionObjectStore } from '../../database/version-object-store';
import { ensureStorageRegistryLoaded } from '../../storage/storage-registry';

/**
 * Возвращает список доступных приватных S3 конфигураций.
 * @returns Конфигурации без секретов и публичных адресов
 */
async function listPrivateVersionStores() {
  const result = await pool.query<{ id: string; name: string; config: Record<string, unknown> }>(
    "SELECT id, name, config FROM storage_configs WHERE backend = 's3' AND read_only = false ORDER BY name");
  return result.rows.filter(row => !row.config?.publicUrlBase).map(({ id, name }) => ({ id, name }));
}

/**
 * Отдаёт выбранный режим, доступные бакеты и ход переноса.
 * @param _req - Запрос администратора
 * @param res - Ответ сервера
 * @returns Завершение ответа
 */
export async function getVersionStorageAdmin(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ ...(await getVersionStorageSettings()), stores: await listPrivateVersionStores(),
      counts: await getVersionStorageCounts(), migrating: await isVersionMigrationRequested() });
  } catch (error) { res.status(500).json({ message: (error as Error).message }); }
}

/**
 * Проверяет бакет и сохраняет выбор для будущих версий.
 * @param req - Режим и ID S3 в теле запроса
 * @param res - Ответ сервера
 * @returns Завершение ответа
 */
export async function putVersionStorageAdmin(req: Request, res: Response): Promise<void> {
  const mode = req.body?.mode;
  const storageId = typeof req.body?.storageId === 'string' ? req.body.storageId.trim() : null;
  if (mode !== 's3' && mode !== 'postgres') { res.status(400).json({ message: 'Выберите S3 или PostgreSQL' }); return; }
  try {
    const previous = await getVersionStorageSettings();
    if (mode === 's3') {
      if (!storageId || !(await listPrivateVersionStores()).some(store => store.id === storageId)) {
        res.status(400).json({ message: 'Выберите приватное хранилище S3' }); return;
      }
      await (await ensureStorageRegistryLoaded()).reload();
      await verifyVersionObjectStore(storageId);
    }
    await saveVersionStorageSettings({ mode, storageId: mode === 's3' ? storageId : previous.storageId });
    res.json({ success: true });
  } catch (error) { res.status(400).json({ message: (error as Error).message }); }
}

/**
 * Запускает продолжимый перенос существующих снимков PostgreSQL в S3.
 * @param _req - Запрос администратора
 * @param res - Ответ сервера
 * @returns Завершение ответа
 */
export async function postVersionStorageMigration(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await getVersionStorageSettings();
    if (settings.mode !== 's3' || !settings.storageId) {
      res.status(400).json({ message: 'Сначала сохраните приватное хранилище S3' }); return;
    }
    await verifyVersionObjectStore(settings.storageId);
    await requestVersionMigration();
    res.json({ success: true });
  } catch (error) { res.status(400).json({ message: (error as Error).message }); }
}
