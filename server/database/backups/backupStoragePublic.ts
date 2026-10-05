/**
 * @fileoverview Публичный адрес хранилища нельзя использовать для дампа базы.
 * В дампе токены ботов и сессии userbot. Приватный S3 отдаёт ссылку через прокси,
 * публичный — прямой https-адрес бакета или CDN.
 * @module server/database/backups/backupStoragePublic
 */

import type { StorageBackend } from "../../storage/storage-backend";

/** ID папки uploads, которую панель раздаёт без входа */
const PUBLIC_LOCAL_ID = "local-default";

/**
 * Пробный ключ: по ссылке на него видно, открыт ли объект снаружи.
 * В бакет не пишется.
 */
const PROBE_KEY = "db-backups/probe.dump";

/**
 * Ссылка ведёт мимо панели: прямой http(s) или каталог `/uploads`.
 * Прокси `/api/media/s3-proxy/...` и папка `.db-backups` публичными не считаются.
 * @param url - Результат `StorageBackend.getUrl`
 * @returns true, если объект по этой ссылке доступен без сессии панели
 */
export function isPublicBackupStorageUrl(url: string): boolean {
  const pathOnly = url.trim().split(/[?#]/, 1)[0] ?? "";
  if (/^https?:\/\//i.test(pathOnly)) return true;
  return pathOnly === "/uploads" || pathOnly.startsWith("/uploads/");
}

/**
 * Запрещает бэкап в публичное хранилище.
 * `local-default` и любой адрес с публичной базой отклоняются одинаково.
 * @param backend - Хранилище, выбранное для дампа
 * @throws Если дамп оказался бы доступен без входа в панель
 */
export function assertBackupStoragePrivate(backend: StorageBackend): void {
  const url = backend.getUrl(PROBE_KEY);
  if (backend.configId === PUBLIC_LOCAL_ID || isPublicBackupStorageUrl(url)) {
    throw new Error(`Хранилище "${backend.configId}" публичное — бэкапы в него не пишутся`);
  }
}
