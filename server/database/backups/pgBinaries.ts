/**
 * @fileoverview Поиск `pg_dump` и `pg_restore` самой новой установленной версии
 *
 * `pg_dump` не снимает базу новее себя, поэтому берётся самая свежая версия
 * из `PG_BIN_DIR`, папок Debian/Ubuntu (`/usr/lib/postgresql/<N>/bin`),
 * Alpine (`/usr/libexec/postgresql<N>`) или из PATH.
 * @module server/database/backups/pgBinaries
 */

import { existsSync, readdirSync } from "fs";
import path from "path";
import { getPgBinDir } from "./dbBackupConfig";

/** Пути к утилитам PostgreSQL */
export interface PgBinaries {
  /** Путь к pg_dump */
  pgDump: string;
  /** Путь к pg_restore */
  pgRestore: string;
  /** Путь к psql */
  psql: string;
  /** Основная версия утилит (например, 18) или null, если взяты из PATH */
  major: number | null;
}

/**
 * Находит папки с утилитами вида `<родитель>/<префикс><N><суффикс>`.
 * @param parent - Родительская папка
 * @param pattern - Шаблон имени с номером версии в первой группе
 * @param suffix - Хвост пути до утилит
 * @returns Пары «версия — папка»
 */
function versionedDirs(parent: string, pattern: RegExp, suffix: string): Array<[number, string]> {
  if (!existsSync(parent)) return [];
  return readdirSync(parent)
    .map((name) => [Number(pattern.exec(name)?.[1]), path.join(parent, name, suffix)] as [number, string])
    .filter(([major, dir]) => Number.isFinite(major) && existsSync(path.join(dir, "pg_dump")));
}

/**
 * Возвращает пути к `pg_dump` и `pg_restore`.
 * @param env - Переменные окружения
 * @returns Пути и основная версия
 */
export function findPgBinaries(env: NodeJS.ProcessEnv = process.env): PgBinaries {
  const custom = getPgBinDir(env);
  if (custom) return inDir(custom, null);
  const candidates = [
    ...versionedDirs("/usr/lib/postgresql", /^(\d+)$/, "bin"),
    ...versionedDirs("/usr/libexec", /^postgresql(\d+)$/, ""),
  ].sort((a, b) => b[0] - a[0]);
  const best = candidates[0];
  if (!best) return { pgDump: "pg_dump", pgRestore: "pg_restore", psql: "psql", major: null };
  return inDir(best[1], best[0]);
}

/**
 * Пути к утилитам в одной папке.
 * @param dir - Папка с утилитами
 * @param major - Основная версия или null
 * @returns Пути к утилитам
 */
function inDir(dir: string, major: number | null): PgBinaries {
  return { pgDump: path.join(dir, "pg_dump"), pgRestore: path.join(dir, "pg_restore"), psql: path.join(dir, "psql"), major };
}
