/** @fileoverview Проверки файлового дампа, снимка базы, очистки и ограниченной доставки. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { access, readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { inspectDumpFile, withTemporaryDump } from './temporaryDump';

const mocks = vi.hoisted(() => ({
  query: vi.fn(), end: vi.fn(), dump: vi.fn(), readIndex: vi.fn(), writeIndex: vi.fn(),
  delivery: vi.fn(), config: vi.fn(), send: vi.fn(),
}));
vi.mock('pg', () => ({ Client: class {
  /** Подключает изолированный тестовый клиент. */
  async connect() {}
  query = mocks.query;
  end = mocks.end;
} }));
vi.mock('./pgDumpRestore', () => ({ runPgDump: mocks.dump }));
vi.mock('./tableRowCounts', () => ({ countTableRows: async () => ({ 'public.test': 3 }) }));
vi.mock('./dbBackupIndex', () => ({
  backupIdFromDate: () => 'now', backupKey: () => 'backup.dump', readBackupIndex: mocks.readIndex,
  writeBackupIndex: mocks.writeIndex, splitForRetention: (entries: unknown[]) => ({ kept: entries, dropped: [] }),
}));
vi.mock('./telegramBackupDelivery', () => ({ deliverTelegramBackup: mocks.send }));
vi.mock('./telegramBackupConfig', () => ({ getTelegramBackupConfig: mocks.config }));
vi.mock('./telegramBackupRequest', () => ({ TELEGRAM_BACKUP_MAX_BYTES: 50_000_000 }));
import { createDbBackup } from './createDbBackup';
import { deliverTelegramBackupFile } from './telegramBackupFile';
import type { StorageBackend } from '../../storage/storage-backend';
import type { DbBackupEntry } from './dbBackupIndex';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.query.mockImplementation(async (sql: string) => ({ rows: sql.includes('snapshot') ? [{ s: 'snapshot-1' }] : [{ v: '16.4' }] }));
  mocks.end.mockResolvedValue(undefined);
  mocks.dump.mockImplementation(async (_url: string, snapshot: string, path: string) => {
    expect(snapshot).toBe('snapshot-1');
    expect(mocks.query.mock.calls.some(([sql]) => sql === 'COMMIT')).toBe(false);
    await writeFile(path, 'PGDMP-content');
  });
  mocks.readIndex.mockResolvedValue({ entries: [] });
  mocks.config.mockReturnValue({ enabled: false });
});
afterEach(() => vi.restoreAllMocks());

describe('файловый бэкап', () => {
  it('передаёт файл вместо Buffer, сохраняет точный хеш и удаляет временный файл', async () => {
    let savedPath = '';
    const backend = { putFile: vi.fn(async (_key: string, path: string) => {
      savedPath = path;
      expect(await readFile(path, 'utf8')).toBe('PGDMP-content');
    }) } as unknown as StorageBackend;
    const result = await createDbBackup({ databaseUrl: 'local-test', label: 'panel', backend, keep: 7 });
    expect(result.entry.size).toBe(13);
    expect(result.entry.sha256).toBe(createHash('sha256').update('PGDMP-content').digest('hex'));
    expect(result.entry.tables).toEqual({ 'public.test': 3 });
    expect(mocks.query).toHaveBeenCalledWith('COMMIT');
    expect(mocks.end).toHaveBeenCalled();
    await expect(access(savedPath)).rejects.toThrow();
  });

  it.each(['dump', 'upload', 'index'])('очищает файл при ошибке %s', async (stage) => {
    let savedPath = '';
    const originalDump = mocks.dump.getMockImplementation()!;
    mocks.dump.mockImplementation(async (...args: [string, string, string]) => {
      savedPath = args[2];
      await originalDump(...args);
      if (stage === 'dump') throw new Error('dump');
    });
    const backend = { putFile: vi.fn(async () => { if (stage === 'upload') throw new Error('upload'); }) } as unknown as StorageBackend;
    if (stage === 'index') mocks.writeIndex.mockRejectedValue(new Error('index'));
    await expect(createDbBackup({ databaseUrl: 'local-test', label: 'panel', backend, keep: 7 })).rejects.toThrow(stage);
    await expect(access(savedPath)).rejects.toThrow();
    expect(mocks.end).toHaveBeenCalled();
    if (stage === 'dump') expect(mocks.query).not.toHaveBeenCalledWith('COMMIT');
  });

  it('считает SHA-256 файла потоковым чтением', async () => {
    await withTemporaryDump(async (path) => {
      await writeFile(path, Buffer.alloc(2_000_000, 17));
      expect(await inspectDumpFile(path)).toEqual({ size: 2_000_000, sha256: createHash('sha256').update(Buffer.alloc(2_000_000, 17)).digest('hex') });
    });
  });
});

describe('доставка временного файла', () => {
  it('не читает большой или отключённый файл', async () => {
    const entry = { size: 684_000_000 } as DbBackupEntry;
    expect(await deliverTelegramBackupFile('несуществующий', 'panel', entry)).toBeUndefined();
    mocks.config.mockReturnValue({ enabled: true });
    expect(await deliverTelegramBackupFile('несуществующий', 'panel', entry)).toContain('50 МБ');
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('передаёт небольшой файл существующему отправителю', async () => {
    mocks.config.mockReturnValue({ enabled: true });
    await withTemporaryDump(async (path) => {
      await writeFile(path, 'small');
      await deliverTelegramBackupFile(path, 'panel', { size: 5 } as DbBackupEntry);
      expect(mocks.send.mock.calls[0][0]).toEqual(Buffer.from('small'));
    });
  });
});
