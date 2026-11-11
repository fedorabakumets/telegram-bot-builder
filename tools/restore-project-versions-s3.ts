/**
 * @fileoverview Восстанавливает проверенные объекты истории версий из локальной копии.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { pool } from '../server/database/db';
import { ensureStorageRegistryLoaded } from '../server/storage/storage-registry';

/**
 * Проверяет архив и загружает его объекты в указанные приватные хранилища.
 * @returns Завершение восстановления объектов
 */
async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) throw new Error('Укажите каталог копии снимков');
  const root = resolve(target);
  const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as {
    versions: Array<{ id: number; storageId: string; key: string; sha256: string; bytes: number }>; };
  if (!Array.isArray(manifest.versions)) throw new Error('Некорректный манифест');
  const registry = await ensureStorageRegistryLoaded();
  for (const entry of manifest.versions) {
    if (!Number.isSafeInteger(entry.id) || entry.id < 1 || !/^project-versions\/\d+\/\d+\.json\.gz$/.test(entry.key)
      || !/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
      throw new Error('Некорректная запись манифеста');
    }
    const body = await readFile(join(root, `${entry.id}.json.gz`));
    const json = gunzipSync(body, { maxOutputLength: 256 * 1024 * 1024 });
    if (json.length !== entry.bytes || createHash('sha256').update(json).digest('hex') !== entry.sha256) {
      throw new Error(`Контрольная сумма версии ${entry.id} не совпадает`);
    }
    const backend = registry.resolveBackend(entry.storageId);
    if (backend.backend !== 's3') throw new Error(`Версия ${entry.id} указывает не на S3`);
    await backend.put(entry.key, body, 'application/gzip');
  }
  console.log(`Восстановлены объекты версий: ${manifest.versions.length}`);
}

main().catch(error => { console.error('Восстановление снимков не прошло:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
