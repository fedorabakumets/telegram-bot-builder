/** @fileoverview Проверка срока следующего бэкапа по сохранённому индексу выбранной базы. */
import type { StorageBackend } from "../../storage/storage-backend";
import { readBackupIndex, type DbBackupEntry } from "./dbBackupIndex";

/**
 * Определяет, истёк ли интервал после последнего успешного бэкапа.
 * @param entries - Успешные бэкапы одной базы из выбранного хранилища
 * @param intervalHours - Интервал создания копий
 * @param now - Текущее время в миллисекундах
 * @returns Нужна ли новая копия; неверные и будущие даты не откладывают защиту базы
 */
export function isDbBackupDue(entries: DbBackupEntry[], intervalHours: number, now = Date.now()): boolean {
  const latest = entries.reduce((last, entry) => {
    const timestamp = Date.parse(entry.createdAt);
    return Number.isFinite(timestamp) && timestamp <= now ? Math.max(last, timestamp) : last;
  }, Number.NEGATIVE_INFINITY);
  return now - latest >= intervalHours * 3_600_000;
}

/**
 * Выполняет действие только для просроченной цели; ошибку чтения не маскирует новым дампом.
 * @param backend - Текущее хранилище копий
 * @param label - Метка конкретной базы
 * @param intervalHours - Интервал расписания
 * @param create - Создание копии, вызываемое только при необходимости
 * @param readIndex - Чтение сохранённого индекса, заменяемое в тестах
 * @returns Создавалась ли новая копия
 */
export async function runDueDbBackup(
  backend: StorageBackend, label: string, intervalHours: number, create: () => Promise<void>,
  readIndex = readBackupIndex,
): Promise<boolean> {
  const index = await readIndex(backend, label);
  if (!isDbBackupDue(index.entries, intervalHours)) return false;
  await create();
  return true;
}
