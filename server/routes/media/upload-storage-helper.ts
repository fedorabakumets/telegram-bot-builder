/**
 * @fileoverview Помощники загрузки медиафайлов через реестр хранилищ
 * (`StorageRegistry`). Выносит из основного роутера логику:
 *
 *  - выбора целевого бэкенда для записи (`resolveUploadBackend`): запрошенный
 *    `storageConfigId` применяется только если он доступен для записи
 *    (`listWritable`), иначе берётся активный бэкенд (Req 11.7);
 *  - фактической записи объекта в бэкенд (`persistUploadToBackend`): для
 *    локального дефолта (`local-default`, папка `uploads/`) файл уже лежит на
 *    диске после multer — он остаётся на месте; для S3 и прочих целей буфер
 *    из временного файла пишется через `backend.put`, а временный файл
 *    удаляется (Req 12.6);
 *  - мягкой квоты локального хранилища (`computeLocalUsedBytes`,
 *    `isQuotaExceeded`): сумма размеров локально хранимых файлов проекта и
 *    сравнение с лимитом из ENV без блокировки загрузки (Req 4.7).
 *
 * @module server/routes/media/upload-storage-helper
 */

import { readFile, unlink } from "fs/promises";
import { join } from "path";

import { and, eq, sql } from "drizzle-orm";

import { mediaFiles } from "@shared/schema";

import { db } from "../../database/db";
import type { StorageBackend, StorageRegistry } from "../../storage/storage-backend";
import { LOCAL_DEFAULT_ID } from "../../storage/storage-config";

/** Результат записи загруженного файла в целевой бэкенд */
export interface UploadPersistResult {
  /** Путь/ключ объекта для поля media_files.filePath */
  filePath: string;
  /** Публичный/проксируемый URL объекта для поля media_files.url */
  url: string;
  /** Тип бэкенда ("local" | "s3") для поля media_files.storageBackend */
  storageBackend: string;
  /** ID конфигурации хранилища для поля media_files.storageConfigId */
  storageConfigId: string;
}

/**
 * Ошибка записи в бэкенд хранилища (например, недоступность S3).
 * Используется роутером для возврата 502 при сбое внешнего хранилища.
 */
export class StorageBackendWriteError extends Error {
  /** Тип бэкенда, на котором произошёл сбой ("local" | "s3") */
  public readonly backend: string;
  /**
   * @param backend - Тип бэкенда, вызвавшего сбой
   * @param cause - Исходная ошибка записи
   */
  constructor(backend: string, cause: unknown) {
    super(cause instanceof Error ? cause.message : "Сбой записи в хранилище");
    this.name = "StorageBackendWriteError";
    this.backend = backend;
  }
}

/**
 * Выбирает целевой бэкенд для новой загрузки.
 *
 * Если передан `storageConfigId`, он применяется только когда соответствующий
 * бэкенд присутствует среди доступных для записи (`listWritable`) — иначе
 * безопасно используется активный бэкенд (Req 11.7). Пустое/отсутствующее
 * значение всегда даёт активный бэкенд.
 * @param registry - Реестр хранилищ
 * @param storageConfigId - Запрошенный ID конфигурации хранилища либо null/undefined
 * @returns Бэкенд, в который следует писать загрузку
 */
export function resolveUploadBackend(
  registry: StorageRegistry,
  storageConfigId: string | null | undefined,
): StorageBackend {
  const requested = typeof storageConfigId === "string" ? storageConfigId.trim() : "";
  if (requested.length > 0) {
    const writable = registry.listWritable().find((b) => b.configId === requested);
    if (writable) {
      return writable;
    }
  }
  return registry.getActiveBackend();
}

/**
 * Вычисляет относительный ключ объекта по пути временного файла multer.
 *
 * Multer пишет файл в `uploads/{projectId}/{date}/{filename}`, поэтому ключ —
 * это часть пути после папки `uploads` (в POSIX-разделителях). Такой ключ
 * совпадает с историческим именованием и пригоден для записи в любой бэкенд.
 * @param filePath - Абсолютный путь временного файла (file.path из multer)
 * @returns Относительный ключ вида `{projectId}/{date}/{filename}`
 */
export function deriveObjectKey(filePath: string): string {
  const uploadsDir = join(process.cwd(), "uploads");
  return filePath
    .replace(uploadsDir, "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

/**
 * Проверяет, является ли бэкенд локальным дефолтом (`local-default`), для
 * которого файл уже лежит на диске после multer и не требует перезаписи.
 * @param backend - Целевой бэкенд
 * @returns true, если это локальный дефолт (папка `uploads/`)
 */
function isLocalDefault(backend: StorageBackend): boolean {
  return backend.backend === "local" && backend.configId === LOCAL_DEFAULT_ID;
}

/**
 * Записывает загруженный файл в целевой бэкенд и возвращает поля для
 * `media_files`.
 *
 * Для локального дефолта файл остаётся на диске (multer уже его записал) —
 * сохраняются исходные `filePath`/`url`. Для S3 и прочих целей содержимое
 * читается из временного файла, пишется через `backend.put`, после чего
 * временный файл удаляется. При сбое записи в бэкенд бросается
 * {@link StorageBackendWriteError} (Req 12.6).
 * @param backend - Целевой бэкенд записи
 * @param file - Загруженный multer-файл
 * @param defaultFilePath - Путь файла на диске для локального дефолта
 * @param defaultUrl - Исторический URL `/uploads/...` для локального дефолта
 * @returns Поля filePath/url/storageBackend/storageConfigId для записи в БД
 */
export async function persistUploadToBackend(
  backend: StorageBackend,
  file: Express.Multer.File,
  defaultFilePath: string,
  defaultUrl: string,
): Promise<UploadPersistResult> {
  // Локальный дефолт: файл уже на диске — ничего не перезаписываем.
  if (isLocalDefault(backend)) {
    return {
      filePath: defaultFilePath,
      url: defaultUrl,
      storageBackend: backend.backend,
      storageConfigId: backend.configId,
    };
  }

  // S3 либо нестандартная локальная папка: пишем буфер во внешний бэкенд.
  const key = deriveObjectKey(file.path);
  const buffer = await readFile(file.path);
  let stored;
  try {
    stored = await backend.put(key, buffer, file.mimetype);
  } catch (err) {
    throw new StorageBackendWriteError(backend.backend, err);
  }

  // Временный файл multer больше не нужен — удаляем (ENOENT игнорируем).
  try {
    await unlink(file.path);
  } catch {
    /* отсутствие временного файла не критично */
  }

  return {
    filePath: stored.key,
    url: stored.url,
    storageBackend: stored.backend,
    storageConfigId: stored.configId,
  };
}

/**
 * Вычисляет суммарный размер локально хранимых файлов проекта (в байтах).
 *
 * Учитываются только записи с `storage_backend = 'local'`; файлы в S3 в
 * квоту локального диска не входят (Req 4.7).
 * @param projectId - Идентификатор проекта
 * @returns Сумма размеров локальных файлов проекта в байтах
 */
export async function computeLocalUsedBytes(projectId: number): Promise<number> {
  const rows = await db
    .select({ total: sql<string>`coalesce(sum(${mediaFiles.fileSize}), 0)` })
    .from(mediaFiles)
    .where(
      and(
        eq(mediaFiles.projectId, projectId),
        eq(mediaFiles.storageBackend, "local"),
      ),
    );
  const total = rows[0]?.total ?? "0";
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Определяет, превышена ли мягкая квота локального хранилища.
 *
 * Квота мягкая: превышение не блокирует загрузку, а лишь поднимает флаг в
 * ответе (Req 4.7). При `limitBytes = null` (безлимит) всегда возвращает false.
 * @param usedBytes - Использовано байт (после текущей загрузки)
 * @param limitBytes - Лимит в байтах либо null для безлимитного режима
 * @returns true, если лимит задан и использование превышает его
 */
export function isQuotaExceeded(
  usedBytes: number,
  limitBytes: number | null,
): boolean {
  if (limitBytes === null) {
    return false;
  }
  return usedBytes > limitBytes;
}
