/**
 * @fileoverview Безопасные пути чтения и закрытый каталог выгрузки
 * @module lib/bot-tools/bot-tables-paths
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

/** Предел размера читаемого файла */
export const MAX_TABLE_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Разрешает чтение только из рабочего каталога или временной папки
 * @param userPath - Путь от вызывающего
 * @returns Абсолютный путь или ошибка
 */
export function resolveTableReadPath(userPath: string): string | { error: string } {
  if (!userPath || userPath.includes('\0')) return { error: 'Недопустимый путь' };
  const abs = path.resolve(userPath);
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(abs);
  } catch {
    return { error: 'Файл не найден' };
  }
  if (stat.isSymbolicLink()) return { error: 'Ссылки запрещены' };
  if (!stat.isFile()) return { error: 'Нужен обычный файл' };
  if (stat.size > MAX_TABLE_FILE_BYTES) return { error: 'Файл слишком большой' };
  const real = fs.realpathSync(abs);
  if (real !== abs) return { error: 'Ссылки запрещены' };
  const roots = [fs.realpathSync(process.cwd()), fs.realpathSync(os.tmpdir())];
  const allowed = roots.some((root) => real === root || real.startsWith(root + path.sep));
  if (!allowed) return { error: 'Путь вне рабочего каталога и временной папки' };
  return real;
}

/**
 * Создаёт закрытый каталог для выгрузки
 * @returns Путь каталога
 */
export function createPrivateExportDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'botcraft-tables-'));
  fs.chmodSync(dir, 0o700);
  return dir;
}

/**
 * Записывает файл с правами только для владельца
 * @param dir - Закрытый каталог
 * @param fileName - Имя файла
 * @param content - Текст
 * @returns Полный путь
 */
export function writePrivateFile(dir: string, fileName: string, content: string): string {
  const target = path.join(dir, fileName);
  fs.writeFileSync(target, content, { mode: 0o600 });
  return target;
}
