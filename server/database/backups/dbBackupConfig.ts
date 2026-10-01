/**
 * @fileoverview Настройки бэкапов PostgreSQL из переменных окружения
 * @module server/database/backups/dbBackupConfig
 */

/** ID служебного приватного локального хранилища бэкапов */
export const DB_BACKUPS_LOCAL_ID = "db-backups-local";

/** Папка локальных бэкапов по умолчанию (не раздаётся по HTTP) */
export const DEFAULT_DB_BACKUPS_DIR = ".db-backups";

/** Сколько последних бэкапов хранить на метку по умолчанию */
export const DEFAULT_DB_BACKUPS_KEEP = 7;

/** Метка бэкапов базы панели по умолчанию */
export const DEFAULT_DB_BACKUP_LABEL = "panel";

/**
 * Читает целое число не меньше `min` из переменной окружения.
 * @param raw - Значение переменной
 * @param fallback - Значение по умолчанию
 * @param min - Минимально допустимое значение
 * @returns Число или значение по умолчанию
 */
function readInt(raw: string | undefined, fallback: number, min: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

/**
 * ID хранилища из `storage_configs` для бэкапов (`DB_BACKUPS_STORAGE_ID`).
 * @param env - Переменные окружения
 * @returns ID конфига или null — тогда приватная локальная папка
 */
export function getDbBackupsStorageId(env: NodeJS.ProcessEnv = process.env): string | null {
  const id = env.DB_BACKUPS_STORAGE_ID?.trim();
  return id ? id : null;
}

/**
 * Папка приватного локального хранилища бэкапов (`DB_BACKUPS_DIR`).
 * @param env - Переменные окружения
 * @returns Путь относительно cwd или абсолютный
 */
export function getDbBackupsDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.DB_BACKUPS_DIR?.trim() || DEFAULT_DB_BACKUPS_DIR;
}

/**
 * Сколько бэкапов хранить на метку (`DB_BACKUPS_KEEP`, минимум 1).
 * @param env - Переменные окружения
 * @returns Количество сохраняемых бэкапов
 */
export function getDbBackupsKeep(env: NodeJS.ProcessEnv = process.env): number {
  return readInt(env.DB_BACKUPS_KEEP, DEFAULT_DB_BACKUPS_KEEP, 1);
}

/**
 * Период автоматического бэкапа базы панели (`DB_BACKUP_INTERVAL_HOURS`).
 * @param env - Переменные окружения
 * @returns Часы между бэкапами; 0 — автоматический бэкап выключен
 */
export function getDbBackupIntervalHours(env: NodeJS.ProcessEnv = process.env): number {
  return readInt(env.DB_BACKUP_INTERVAL_HOURS, 0, 0);
}

/**
 * Папка с `pg_dump` и `pg_restore`, если они не в стандартных местах (`PG_BIN_DIR`).
 * @param env - Переменные окружения
 * @returns Путь или null — искать автоматически
 */
export function getPgBinDir(env: NodeJS.ProcessEnv = process.env): string | null {
  const dir = env.PG_BIN_DIR?.trim();
  return dir ? dir : null;
}

/**
 * Проверяет метку бэкапов: она становится частью ключа объекта.
 * @param label - Метка (например, "panel" или "railway-tbb-bots")
 * @returns Та же метка
 * @throws Если в метке есть что-то кроме латиницы, цифр, `-` и `_`
 */
export function assertBackupLabel(label: string): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(label)) {
    throw new Error(`Недопустимая метка бэкапа "${label}": только латиница, цифры, "-" и "_"`);
  }
  return label;
}
