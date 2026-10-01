/**
 * @fileoverview Перенос кэша байткода (.botcode) на копию папки бота.
 * Ключ кэша в bot_code_cache.py содержит размер и st_mtime_ns файла, а копирование
 * сохраняет время только до микросекунд — без переименования кэш в копии не совпадёт.
 * @module server/bots/retargetBotCodeCache
 */

import { existsSync, readdirSync, renameSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

/**
 * Переименовывает .bin кэша в копии под размер и время копии основного файла
 * @param sourceFile - Исходный .py бота
 * @param copiedFile - Скопированный .py бота
 * @returns true, если кэш найден и переименован
 */
export function retargetBotCodeCache(sourceFile: string, copiedFile: string): boolean {
  const cacheDir = join(dirname(copiedFile), ".botcode");
  if (!existsSync(cacheDir)) return false;
  const stem = basename(copiedFile, extname(copiedFile));
  const src = statSync(sourceFile, { bigint: true });
  const dst = statSync(copiedFile, { bigint: true });
  const sourceSuffix = `.${src.size}.${src.mtimeNs}.bin`;
  const cached = readdirSync(cacheDir).find((name) => name.startsWith(`${stem}.`) && name.endsWith(sourceSuffix));
  if (!cached) return false;
  const retargeted = `${cached.slice(0, -sourceSuffix.length)}.${dst.size}.${dst.mtimeNs}.bin`;
  if (retargeted !== cached) renameSync(join(cacheDir, cached), join(cacheDir, retargeted));
  return true;
}
