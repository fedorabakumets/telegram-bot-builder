/** @fileoverview Проверки форматов сессий и адресов прокси на синтетических данных. */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, it, vi } from 'vitest';
import { normalizeProjectTelegramProxy, resolveProjectTelegramProxy } from '../../server/bots/project-telegram-accounts/proxy';
import { encodeTelegramSession, validateTelegramStringSession } from '../../server/bots/project-telegram-accounts/session-format';
import { readProjectTelegramSessionImport } from '../../server/bots/project-telegram-accounts/session-import';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup }));

it('принимает структуру Telethon и исключает произвольный адрес назначения', () => {
  const fake = Buffer.alloc(256, 15);
  const session = encodeTelegramSession(2, '149.154.167.51', 443, fake);
  expect(validateTelegramStringSession(session)).toBe(session);
  expect(() => encodeTelegramSession(2, '8.8.8.8', 443, fake)).toThrow(/данные подключения Telegram/);
  expect(() => encodeTelegramSession(2, '149.154.167.51', 8443, fake)).toThrow();
});

it('импортирует локальный SQLite и читает только разрешённые поля JSON', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'project-telegram-test-'));
  const path = join(folder, 'fixture.session');
  try {
    const db = new DatabaseSync(path);
    try {
      db.exec('CREATE TABLE sessions (dc_id INTEGER, server_address TEXT, port INTEGER, auth_key BLOB)');
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(2, '149.154.167.51', 443, Buffer.alloc(256, 15));
    } finally { db.close(); }
    const fileBase64 = (await readFile(path)).toString('base64');
    const result = await readProjectTelegramSessionImport({ kind: 'session-json', fileBase64, metadata: {
      app_id: 12345, app_hash: 'a'.repeat(32), first_name: 'Идентичность из экспорта',
    } });
    expect(result).toEqual({ apiId: '12345', apiHash: 'a'.repeat(32), sessionKind: 'session-json',
      sessionString: encodeTelegramSession(2, '149.154.167.51', 443, Buffer.alloc(256, 15)) });
  } finally { await rm(folder, { recursive: true, force: true }); }
});

it('отбрасывает внутренние и смешанные ответы DNS и фиксирует проверенный адрес', async () => {
  const proxy = { type: 'socks5', host: 'proxy.example.test', port: 1080 } as const;
  expect(() => normalizeProjectTelegramProxy({ ...proxy, host: '[::ffff:127.0.0.1]' })).toThrow(/публичный адрес/);
  lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }, { address: '192.168.1.1' }]);
  await expect(resolveProjectTelegramProxy(proxy)).rejects.toThrow(/публичный адрес/);
  lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
  await expect(resolveProjectTelegramProxy(proxy)).resolves.toMatchObject({ host: '8.8.8.8' });
});
