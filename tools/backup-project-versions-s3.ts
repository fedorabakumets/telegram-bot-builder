/**
 * @fileoverview Сохраняет проверенную копию объектов истории версий рядом с дампом БД.
 */
import 'dotenv/config';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { isNotNull } from 'drizzle-orm';
import { projectVersions } from '@shared/schema';
import { db, pool } from '../server/database/db';
import { ensureStorageRegistryLoaded } from '../server/storage/storage-registry';
import { decodeSnapshot } from '../server/database/version-object-codec';

/**
 * Копирует все готовые объекты и проверяет содержимое каждого.
 * @returns Завершение резервного копирования
 */
async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) throw new Error('Укажите каталог назначения для копии снимков');
  const root = resolve(target);
  await mkdir(root, { recursive: true });
  const registry = await ensureStorageRegistryLoaded();
  const rows = await db.select().from(projectVersions).where(isNotNull(projectVersions.snapshotKey));
  const manifest: Array<{ id: number; storageId: string; key: string; sha256: string; bytes: number }> = [];
  for (const row of rows) {
    if (!row.snapshotKey || !row.snapshotStorageId || !row.snapshotSha256 || row.snapshotBytes === null) {
      throw new Error(`Неполные метаданные версии ${row.id}`);
    }
    const backend = registry.resolveBackend(row.snapshotStorageId);
    if (backend.backend !== 's3') throw new Error(`Версия ${row.id} указывает не на S3`);
    const file = join(root, `${row.id}.json.gz`);
    await pipeline(await backend.get(row.snapshotKey) as NodeJS.ReadableStream, createWriteStream(file));
    await decodeSnapshot(createReadStream(file), row);
    manifest.push({ id: row.id, storageId: row.snapshotStorageId, key: row.snapshotKey,
      sha256: row.snapshotSha256, bytes: row.snapshotBytes });
  }
  await writeFile(join(root, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), versions: manifest }, null, 2));
  console.log(`Сохранены и проверены объекты версий: ${manifest.length}; каталог: ${root}`);
}

main().catch(error => { console.error('Копия снимков не создана:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
