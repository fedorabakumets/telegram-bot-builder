/** @fileoverview Импорт поддерживаемых форматов Telethon с локальной проверкой структуры. */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ProjectTelegramSessionInput } from '../../database/project-telegram-account-secrets';
import { ProjectTelegramInputError, telegramApiCredentials, telegramInput } from './input';
import { encodeTelegramSession, validateTelegramStringSession } from './session-format';

const maxFileBytes = 1024 * 1024;

/**
 * Читает только единственную строку подключения из файла Telethon и удаляет временную копию.
 * @param raw - Файл SQLite в кодировке Base64.
 * @returns Проверенная строка сессии.
 */
async function readSqliteSession(raw: unknown): Promise<string> {
  if (typeof raw !== 'string' || raw.length > Math.ceil(maxFileBytes / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    throw new ProjectTelegramInputError('Выберите файл Telethon .session размером до 1 МБ.');
  }
  const bytes = Buffer.from(raw, 'base64');
  if (bytes.length > maxFileBytes || bytes.toString('base64') !== raw || bytes.subarray(0, 16).toString() !== 'SQLite format 3\0') {
    throw new ProjectTelegramInputError('Файл .session должен быть базой SQLite Telethon.');
  }
  const directory = await mkdtemp(join(tmpdir(), 'project-telegram-session-'));
  const path = join(directory, 'import.session');
  try {
    await writeFile(path, bytes, { mode: 0o600, flag: 'wx' });
    const db = new DatabaseSync(path, { readOnly: true, allowExtension: false });
    try {
      db.exec('PRAGMA trusted_schema = OFF; PRAGMA query_only = ON');
      const table = db.prepare("SELECT sql FROM sqlite_schema WHERE name = 'sessions' AND type = 'table'").get();
      if (typeof table?.sql !== 'string' || !/^CREATE TABLE\b/i.test(table.sql)) throw new Error();
      const rows = db.prepare('SELECT dc_id, server_address, port, auth_key FROM sessions LIMIT 2').all();
      if (rows.length !== 1) throw new Error();
      const row = rows[0];
      return encodeTelegramSession(row.dc_id, row.server_address, row.port, row.auth_key);
    } finally {
      db.close();
    }
  } catch (error) {
    if (error instanceof ProjectTelegramInputError) throw error;
    throw new ProjectTelegramInputError('Не удалось прочитать сессию из файла Telethon.');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * Читает поддерживаемый импорт и подтверждает структуру без запуска чужого ключа.
 * @param raw - Тело запроса импорта.
 * @returns Секрет для записи сервером.
 */
export async function readProjectTelegramSessionImport(raw: unknown): Promise<ProjectTelegramSessionInput> {
  const { kind, apiId, apiHash, fileBase64, sessionString, metadata } = telegramInput(raw);
  if (kind !== 'session' && kind !== 'session-json' && kind !== 'string-session') {
    throw new ProjectTelegramInputError('Поддерживаются файлы Telethon .session и строки StringSession.');
  }
  const extra = kind === 'session-json' ? telegramInput(metadata) : {};
  if (kind === 'session-json' && (!metadata || metadata !== extra)) throw new ProjectTelegramInputError('Укажите JSON с параметрами сессии.');
  const credentials = telegramApiCredentials(
    apiId || extra.api_id || extra.app_id || extra.apiId,
    apiHash || extra.api_hash || extra.app_hash || extra.apiHash,
  );
  const session = kind === 'string-session' ? validateTelegramStringSession(sessionString) : await readSqliteSession(fileBase64);
  return { ...credentials, sessionKind: kind, sessionString: session };
}
