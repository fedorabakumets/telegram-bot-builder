/**
 * @fileoverview Список бэкапов одной метки в самом хранилище (`index.json`)
 *
 * Список лежит рядом с дампами, а не в базе панели: так бэкап можно найти
 * и восстановить, даже если база панели потеряна целиком.
 * @module server/database/backups/dbBackupIndex
 */

import { readStreamToBuffer } from "../../bots/builds/botBuildCodec";
import type { StorageBackend } from "../../storage/storage-backend";

/** Один бэкап базы */
export interface DbBackupEntry {
  /** ID бэкапа: время создания UTC вида 20261001-140501 */
  id: string;
  /** Ключ объекта дампа в хранилище */
  key: string;
  /** Размер дампа в байтах */
  size: number;
  /** SHA-256 дампа в hex */
  sha256: string;
  /** Время создания в ISO */
  createdAt: string;
  /** Версия сервера PostgreSQL, с которого снят дамп */
  serverVersion: string;
  /** Количество строк по таблицам `схема.таблица` в момент дампа */
  tables: Record<string, number>;
}

/** Список бэкапов метки, новые первыми */
export interface DbBackupIndex {
  /** Метка базы (например, "panel") */
  label: string;
  /** Бэкапы, новые первыми */
  entries: DbBackupEntry[];
}

/**
 * Префикс ключей бэкапов метки.
 * @param label - Метка базы
 * @returns Префикс без завершающего слеша
 */
export function backupPrefix(label: string): string {
  return `db-backups/${label}`;
}

/**
 * Ключ объекта дампа.
 * @param label - Метка базы
 * @param id - ID бэкапа
 * @returns Ключ в хранилище
 */
export function backupKey(label: string, id: string): string {
  return `${backupPrefix(label)}/${id}.dump`;
}

/**
 * Строит ID бэкапа из времени.
 * @param date - Время создания
 * @returns Строка вида 20261001-140501 (UTC)
 */
export function backupIdFromDate(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 19).replace(/:/g, "")}`;
}

/**
 * Делит бэкапы на сохраняемые и лишние.
 * @param entries - Бэкапы, новые первыми
 * @param keep - Сколько последних хранить
 * @returns Сохраняемые и удаляемые бэкапы
 */
export function splitForRetention(entries: DbBackupEntry[], keep: number): { kept: DbBackupEntry[]; dropped: DbBackupEntry[] } {
  const sorted = [...entries].sort((a, b) => b.id.localeCompare(a.id));
  return { kept: sorted.slice(0, keep), dropped: sorted.slice(keep) };
}

/**
 * Находит бэкап по ID или последний.
 * @param index - Список бэкапов
 * @param id - ID бэкапа или "latest"
 * @returns Бэкап или null
 */
export function findBackup(index: DbBackupIndex, id: string): DbBackupEntry | null {
  if (id === "latest") return index.entries[0] ?? null;
  return index.entries.find((entry) => entry.id === id) ?? null;
}

/**
 * Отличает «объекта нет» от других ошибок хранилища.
 * @param error - Ошибка чтения
 * @returns true, если объекта нет (локально ENOENT, в S3 NoSuchKey/404)
 */
export function isNotFoundError(error: unknown): boolean {
  const err = error as { code?: string; name?: string; $metadata?: { httpStatusCode?: number } };
  return err?.code === "ENOENT" || err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404;
}

/**
 * Читает список бэкапов метки; если его ещё нет — пустой список.
 * @param backend - Хранилище
 * @param label - Метка базы
 * @returns Список бэкапов
 */
export async function readBackupIndex(backend: StorageBackend, label: string): Promise<DbBackupIndex> {
  try {
    const raw = await readStreamToBuffer(await backend.get(`${backupPrefix(label)}/index.json`));
    const parsed = JSON.parse(raw.toString("utf8")) as DbBackupIndex;
    return { label, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch (error) {
    if (isNotFoundError(error)) return { label, entries: [] };
    throw error;
  }
}

/**
 * Записывает список бэкапов метки.
 * @param backend - Хранилище
 * @param index - Список бэкапов
 */
export async function writeBackupIndex(backend: StorageBackend, index: DbBackupIndex): Promise<void> {
  const body = Buffer.from(JSON.stringify(index, null, 2), "utf8");
  await backend.put(`${backupPrefix(index.label)}/index.json`, body, "application/json");
}
