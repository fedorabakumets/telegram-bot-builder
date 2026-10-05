/**
 * @fileoverview Хранилище загрузок панели в S3: какое хранилище назначено
 * для `/uploads` (`UPLOADS_STORAGE_ID`), безопасный разбор ключа из URL и
 * определение Content-Type по расширению. Адрес `/uploads/<ключ>` остаётся
 * логическим адресом файла; ключ в бакете совпадает с путём внутри `uploads/`.
 * @module server/storage/uploads-storage
 */

import path from "path";

import { runtimeEnv } from "../services/runtime-overlay";
import type { StorageBackend } from "./storage-backend";

/** Имя переменной окружения с ID хранилища загрузок (storage_configs.id) */
export const UPLOADS_STORAGE_ID_ENV = "UPLOADS_STORAGE_ID";

/** Префикс логического URL загрузок */
export const UPLOADS_URL_PREFIX = "/uploads/";

/** Content-Type по расширению файла для отдачи из S3 */
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".zip": "application/zip",
};

/**
 * Возвращает ID хранилища загрузок из окружения.
 * @param env - Переменные окружения
 * @returns ID конфига либо null, если запасное чтение из S3 выключено
 */
export function getUploadsStorageId(env: NodeJS.ProcessEnv = process.env): string | null {
  return runtimeEnv(UPLOADS_STORAGE_ID_ENV, env) ?? null;
}

/**
 * Превращает путь запроса внутри `/uploads` в ключ объекта.
 * Отклоняет пустые ключи, `..`, `.` и управляющие символы.
 * @param requestPath - Путь после `/uploads` (например, `/3/2026-08-19/a.jpg`)
 * @returns Ключ объекта (`3/2026-08-19/a.jpg`) либо null для недопустимого пути
 */
export function uploadKeyFromPath(requestPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  if (/[\u0000-\u001f]/.test(decoded)) return null;
  const parts = decoded.replace(/\\/g, "/").split("/").filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  if (parts.some((p) => p === ".." || p === ".")) return null;
  return parts.join("/");
}

/**
 * Ключ объекта по логическому URL `/uploads/...`.
 * @param url - URL из media_files или из данных узла
 * @returns Ключ объекта либо null, если URL не из `/uploads/`
 */
export function uploadKeyFromUrl(url: string): string | null {
  if (!url.startsWith(UPLOADS_URL_PREFIX)) return null;
  return uploadKeyFromPath(url.slice(UPLOADS_URL_PREFIX.length - 1));
}

/**
 * Определяет Content-Type по расширению ключа.
 * @param key - Ключ объекта
 * @returns MIME-тип; для неизвестных расширений — application/octet-stream
 */
export function contentTypeForKey(key: string): string {
  return CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Находит S3-бэкенд хранилища загрузок среди зарегистрированных.
 * @param backends - Все бэкенды реестра
 * @param storageId - ID хранилища загрузок
 * @returns S3-бэкенд либо null, если такого S3-хранилища нет
 */
export function findUploadsBackend(
  backends: StorageBackend[],
  storageId: string | null,
): StorageBackend | null {
  if (!storageId) return null;
  return backends.find((b) => b.configId === storageId && b.backend === "s3") ?? null;
}
