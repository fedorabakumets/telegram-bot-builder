/**
 * @fileoverview Восстановление бэкапа базы с проверкой целостности и числа строк
 * @module server/database/backups/restoreDbBackup
 */

import { createHash } from "crypto";
import { Client } from "pg";
import { readStreamToBuffer } from "../../bots/builds/botBuildCodec";
import type { StorageBackend } from "../../storage/storage-backend";
import { findBackup, readBackupIndex, type DbBackupEntry } from "./dbBackupIndex";
import { runPgRestore } from "./pgDumpRestore";
import { compareRowCounts, countTableRows, listUserTables, type RowCountMismatch } from "./tableRowCounts";

/** Параметры восстановления */
export interface RestoreDbBackupOptions {
  /** Строка подключения к целевой базе */
  databaseUrl: string;
  /** Метка базы */
  label: string;
  /** ID бэкапа или "latest" */
  id: string;
  /** Хранилище бэкапов */
  backend: StorageBackend;
  /** Разрешить восстановление в непустую базу (её объекты будут пересозданы) */
  force: boolean;
  /** Журнал шагов */
  log?: (message: string) => void;
}

/** Результат восстановления */
export interface RestoreDbBackupResult {
  /** Восстановленный бэкап */
  entry: DbBackupEntry;
  /** Таблицы, где число строк не совпало с бэкапом */
  mismatches: RowCountMismatch[];
}

/**
 * Скачивает дамп и сверяет размер и SHA-256 со списком.
 * @param backend - Хранилище
 * @param entry - Бэкап
 * @returns Содержимое дампа
 * @throws Если дамп повреждён
 */
async function loadVerifiedDump(backend: StorageBackend, entry: DbBackupEntry): Promise<Buffer> {
  const dump = await readStreamToBuffer(await backend.get(entry.key));
  const sha256 = createHash("sha256").update(dump).digest("hex");
  if (dump.length !== entry.size || sha256 !== entry.sha256) {
    throw new Error(`Дамп ${entry.key} повреждён: размер ${dump.length}/${entry.size}, sha256 не совпадает`);
  }
  return dump;
}

/**
 * Выполняет запрос к целевой базе отдельным подключением.
 * @param databaseUrl - Строка подключения
 * @param fn - Действие с клиентом
 * @returns Результат действия
 */
async function withClient<T>(databaseUrl: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Восстанавливает бэкап в базу и сверяет числа строк по таблицам.
 * @param options - Параметры восстановления
 * @returns Бэкап и расхождения (пусто — всё совпало)
 * @throws Если бэкапа нет, дамп повреждён, сервер старше исходного или база не пуста без `force`
 */
export async function restoreDbBackup(options: RestoreDbBackupOptions): Promise<RestoreDbBackupResult> {
  const { backend, label, log = () => undefined } = options;
  const entry = findBackup(await readBackupIndex(backend, label), options.id);
  if (!entry) throw new Error(`Бэкап "${options.id}" с меткой "${label}" не найден`);

  const dump = await loadVerifiedDump(backend, entry);
  log(`дамп ${entry.key} скачан и проверен (${dump.length} байт)`);

  const target = await withClient(options.databaseUrl, async (client) => ({
    tables: await listUserTables(client),
    major: Math.floor(Number((await client.query<{ v: string }>("SELECT current_setting('server_version_num') AS v")).rows[0].v) / 10000),
  }));
  const sourceMajor = Number.parseInt(entry.serverVersion, 10);
  if (target.major < sourceMajor) {
    throw new Error(`PostgreSQL целевой базы (${target.major}) старше исходной (${sourceMajor}): нужен сервер ${sourceMajor} или новее`);
  }
  if (target.tables.length > 0 && !options.force) {
    throw new Error(`Целевая база не пуста (${target.tables.length} таблиц). Для перезаписи нужен --force`);
  }
  log(target.tables.length > 0 ? `перезаписываем ${target.tables.length} таблиц` : "целевая база пуста, восстанавливаем");
  await runPgRestore(options.databaseUrl, dump, { clean: target.tables.length > 0, targetMajor: target.major });

  const actual = await withClient(options.databaseUrl, countTableRows);
  const mismatches = compareRowCounts(entry.tables, actual);
  log(`проверено таблиц: ${Object.keys(entry.tables).length}, расхождений: ${mismatches.length}`);
  return { entry, mismatches };
}
