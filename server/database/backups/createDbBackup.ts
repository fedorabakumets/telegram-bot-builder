/**
 * @fileoverview Создание бэкапа базы: дамп, проверочные числа строк, загрузка, ротация
 *
 * Дамп и подсчёт строк идут в одном снимке базы (`pg_export_snapshot`),
 * поэтому числа строк точно соответствуют содержимому дампа.
 * @module server/database/backups/createDbBackup
 */

import { createHash } from "crypto";
import { Client } from "pg";
import type { StorageBackend } from "../../storage/storage-backend";
import {
  backupIdFromDate, backupKey, readBackupIndex, splitForRetention, writeBackupIndex, type DbBackupEntry,
} from "./dbBackupIndex";
import { runPgDump } from "./pgDumpRestore";
import { countTableRows } from "./tableRowCounts";

/** Параметры создания бэкапа */
export interface CreateDbBackupOptions {
  /** Строка подключения к базе */
  databaseUrl: string;
  /** Метка базы */
  label: string;
  /** Хранилище бэкапов */
  backend: StorageBackend;
  /** Сколько последних бэкапов хранить */
  keep: number;
  /** Текущее время (для тестов) */
  now?: Date;
  /** Журнал шагов */
  log?: (message: string) => void;
}

/** Результат создания бэкапа */
export interface CreateDbBackupResult {
  /** Созданный бэкап */
  entry: DbBackupEntry;
  /** Сколько старых бэкапов удалено */
  dropped: number;
}

/** Снятый дамп с проверочными данными */
interface SnapshotDump {
  /** Содержимое дампа */
  dump: Buffer;
  /** Версия сервера */
  serverVersion: string;
  /** Строки по таблицам */
  tables: Record<string, number>;
}

/**
 * Снимает дамп и считает строки внутри одного снимка базы.
 * @param databaseUrl - Строка подключения
 * @returns Дамп, версия сервера и числа строк
 */
async function dumpWithinSnapshot(databaseUrl: string): Promise<SnapshotDump> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const snapshot = (await client.query<{ s: string }>("SELECT pg_export_snapshot() AS s")).rows[0].s;
    const serverVersion = (await client.query<{ v: string }>("SHOW server_version")).rows[0].v.split(" ")[0];
    const tables = await countTableRows(client);
    const dump = await runPgDump(databaseUrl, snapshot);
    await client.query("COMMIT");
    return { dump, serverVersion, tables };
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Создаёт бэкап базы, обновляет список и удаляет лишние старые бэкапы.
 * @param options - Параметры создания
 * @returns Созданный бэкап и число удалённых
 */
export async function createDbBackup(options: CreateDbBackupOptions): Promise<CreateDbBackupResult> {
  const { backend, label, log = () => undefined } = options;
  log(`снимаем дамп базы (метка ${label})`);
  const { dump, serverVersion, tables } = await dumpWithinSnapshot(options.databaseUrl);

  const index = await readBackupIndex(backend, label);
  let id = backupIdFromDate(options.now ?? new Date());
  if (index.entries.some((entry) => entry.id === id)) id = `${id}-${index.entries.length}`;
  const entry: DbBackupEntry = {
    id,
    key: backupKey(label, id),
    size: dump.length,
    sha256: createHash("sha256").update(dump).digest("hex"),
    createdAt: (options.now ?? new Date()).toISOString(),
    serverVersion,
    tables,
  };
  await backend.put(entry.key, dump, "application/octet-stream");
  log(`дамп ${entry.key}: ${dump.length} байт, ${Object.keys(tables).length} таблиц, PostgreSQL ${serverVersion}`);

  const { kept, dropped } = splitForRetention([entry, ...index.entries], options.keep);
  await writeBackupIndex(backend, { label, entries: kept });
  for (const old of dropped) {
    await backend.delete(old.key).catch((error) => log(`не удалён старый бэкап ${old.key}: ${String(error)}`));
  }
  if (dropped.length > 0) log(`удалено старых бэкапов: ${dropped.length}`);
  return { entry, dropped: dropped.length };
}
