/** @fileoverview Проверка потокового бэкапа и восстановления на двух новых локальных базах. */
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { LocalDiskBackend } from '../server/storage/local-disk-backend';
import { createDbBackup } from '../server/database/backups/createDbBackup';
import { restoreDbBackup } from '../server/database/backups/restoreDbBackup';
import { readBackupIndex } from '../server/database/backups/dbBackupIndex';

/** Создаёт только изолированные базы, проверяет дамп, ротацию и восстановление, затем удаляет свои ресурсы. */
async function main(): Promise<void> {
  const original = new URL(process.env.LOCAL_DATABASE_TEST_URL || 'postgres://localhost/postgres');
  assert(['localhost', '127.0.0.1', '[::1]'].includes(original.hostname), 'Разрешена только локальная БД');
  const marker = `backup_stream_${process.pid}_${Date.now()}`;
  const names = [`${marker}_source`, `${marker}_target`];
  const created: string[] = [];
  const directory = await mkdtemp(join(tmpdir(), 'backup-stream-check-'));
  const admin = new Client({ connectionString: original.toString() });
  await admin.connect();
  try {
    for (const name of names) { await admin.query(`CREATE DATABASE "${name}"`); created.push(name); }
    const source = new URL(original); source.pathname = `/${names[0]}`;
    const target = new URL(original); target.pathname = `/${names[1]}`;
    const client = new Client({ connectionString: source.toString() });
    await client.connect();
    try {
      await client.query('CREATE TABLE fixture (id integer PRIMARY KEY, body text NOT NULL)');
      await client.query("INSERT INTO fixture SELECT i, repeat(md5(i::text), 100) FROM generate_series(1,1000) i");
    } finally { await client.end(); }
    const backend = new LocalDiskBackend({ configId: 'test', name: 'test', rootPath: directory, readOnly: false });
    const options = { databaseUrl: source.toString(), label: 'test', backend, keep: 1 };
    const first = await createDbBackup({ ...options, now: new Date('2026-01-01T00:00:00Z') });
    assert(first.entry.size > 0);
    assert.equal(first.entry.tables['public.fixture'], 1000);
    const second = await createDbBackup({ ...options, now: new Date('2026-01-02T00:00:00Z') });
    assert.equal(second.dropped, 1);
    assert.deepEqual((await readBackupIndex(backend, 'test')).entries.map(item => item.id), [second.entry.id]);
    const restored = await restoreDbBackup({ databaseUrl: target.toString(), label: 'test', id: 'latest', backend, force: false });
    assert.deepEqual(restored.mismatches, []);
    await assert.rejects(restoreDbBackup({ databaseUrl: target.toString(), label: 'test', id: 'latest', backend, force: false }), /не пуста/);
    console.log('OK: потоковый дамп, индекс, ротация, SHA-256, восстановление 1000 строк и защита непустой БД');
  } finally {
    for (const name of created.reverse()) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.end();
    await rm(directory, { recursive: true, force: true });
  }
}
void main().catch(() => { console.error('Проверка локального бэкапа завершилась ошибкой'); process.exitCode = 1; });
