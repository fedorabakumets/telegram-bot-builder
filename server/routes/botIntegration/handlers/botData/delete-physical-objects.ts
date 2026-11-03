/**
 * @fileoverview Физическое удаление загруженных объектов через резолв бэкенда
 * хранилища. Для каждой записи `media_files` резолвит `StorageBackend` по
 * `storageConfigId` (null → `local-default`, Req 10.5) и удаляет объект именно
 * из того хранилища, где он лежит, независимо от активного для записи (Req 10.4).
 *
 * Отсутствие объекта (ENOENT для локального диска, `NotFound`/`NoSuchKey` для
 * S3) игнорируется — удаление идемпотентно. Прочие ошибки логируются без
 * значений секретов и не прерывают удаление остальных файлов/записи в БД.
 * @module botIntegration/handlers/botData/delete-physical-objects
 */

import { join } from "path";

import { ensureStorageRegistryLoaded } from "../../../../storage/storage-registry";

/** Запись медиафайла, достаточная для физического удаления объекта */
export interface DeletableMediaRow {
  /** Путь/ключ объекта (`media_files.filePath`) либо null */
  filePath: string | null;
  /** ID конфигурации хранилища (`media_files.storageConfigId`); null = `local-default` */
  storageConfigId: string | null;
}

/** Коды ошибок «объект отсутствует», которые трактуются как успех */
const MISSING_OBJECT_CODES = new Set(["ENOENT", "NotFound", "NoSuchKey"]);

/**
 * Приводит сохранённый `filePath` к ключу объекта относительно корня бэкенда.
 *
 * Локальные файлы исторически хранят абсолютный путь `<cwd>/uploads/<key>` или
 * относительный `/uploads/<key>`; бэкенду нужен только `<key>`. S3 и
 * нестандартные локальные папки уже хранят голый ключ — для них преобразование
 * идемпотентно (ключ вида `{projectId}/{date}/{filename}` не начинается с
 * `uploads/`, поэтому не искажается).
 * @param filePath - Значение `media_files.filePath`
 * @returns Относительный ключ объекта в его хранилище
 */
export function resolveStorageKey(filePath: string): string {
  const uploadsDir = join(process.cwd(), "uploads");
  return filePath
    .replace(uploadsDir, "") // срезаем абсолютный префикс <cwd>/uploads
    .replace(/\\/g, "/") // нормализуем разделители в POSIX
    .replace(/^\/+/, "") // убираем ведущие слеши
    .replace(/^uploads\//, ""); // срезаем исторический сегмент uploads/
}

/**
 * Удаляет физические объекты для набора записей `media_files` через резолв
 * бэкенда по `storageConfigId` (Req 10.4). Отсутствие объекта игнорируется
 * (идемпотентность); прочие ошибки логируются и не прерывают цикл.
 * @param rows - Записи медиафайлов (нужны `filePath` и `storageConfigId`)
 * @returns Отдельные счётчики удаления, отсутствия и ошибок без секретов
 */
export async function deleteUploadedPhysicalObjects(
  rows: DeletableMediaRow[],
): Promise<{ deleted: number; missing: number; failed: number; untracked: number }> {
  const result = { deleted: 0, missing: 0, failed: 0, untracked: 0 };
  if (!rows.length) return result;
  let registry: Awaited<ReturnType<typeof ensureStorageRegistryLoaded>>;
  try { registry = await ensureStorageRegistryLoaded(); }
  catch { return { ...result, failed: rows.length }; }
  for (const row of rows) {
    if (!row.filePath) { result.untracked++; continue; }
    try {
      await registry.resolveBackend(row.storageConfigId).delete(resolveStorageKey(row.filePath));
      result.deleted++;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code && MISSING_OBJECT_CODES.has(code)) result.missing++;
      else { result.failed++; console.warn('[deleteFiles] Физическое удаление объекта не подтверждено'); }
    }
  }
  return result;
}
