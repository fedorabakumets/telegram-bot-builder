/** @fileoverview Локальная проверка расхода памяти при записи файла размером 256 МиБ. */
import { build } from 'esbuild';
import { mkdtemp, open, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

/** Изолированный каталог для собранного модуля и тестовых файлов. */
const directory = await mkdtemp(path.join(os.tmpdir(), 'tbb-stream-memory-'));
/** Объём файла, превышающий допустимый рост памяти в несколько раз. */
const size = 256 * 1024 * 1024;
let sampling;
try {
  const bundle = path.join(directory, 'backend.mjs');
  await build({ entryPoints: ['server/storage/local-disk-backend.ts'], outfile: bundle, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  const { LocalDiskBackend } = await import(pathToFileURL(bundle).href);
  const source = path.join(directory, 'source.sql');
  const file = await open(source, 'w');
  await file.truncate(size);
  await file.close();
  const backend = new LocalDiskBackend({ configId: 'test', name: 'Тест', readOnly: false, rootPath: path.join(directory, 'objects') });
  const initialRss = process.memoryUsage().rss;
  let peakRss = initialRss;
  sampling = setInterval(() => { peakRss = Math.max(peakRss, process.memoryUsage().rss); }, 5);
  const stored = await backend.putFile('backup.sql', source, 'application/sql');
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
  assert.equal(stored.size, size);
  const growth = peakRss - initialRss;
  assert.ok(growth < 96 * 1024 * 1024, `Рост RSS превышает 96 МиБ: ${growth}`);
  console.log(JSON.stringify({ fileMiB: size / 1048576, initialRssMiB: Math.round(initialRss / 1048576), peakRssMiB: Math.round(peakRss / 1048576), growthMiB: Math.round(growth / 1048576) }));
} finally {
  clearInterval(sampling);
  await rm(directory, { recursive: true, force: true });
}
