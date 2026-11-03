/**
 * @fileoverview Атомарная локальная запись через временный файл и проверку прочитанного результата.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
/** Квитанция локального файла не означает запись проекта в приложении. */
export interface LocalFileReceipt {
 /** Эффект на локальной файловой системе. */
 effect: 'local_file';
 /** Подтверждённое завершение записи. */
 outcome: 'saved';
 /** Доказательство повторного чтения файла. */
 persistence: { confirmed: true; method: 'readback'; sha256: string };
}
/**
 * Пишет UTF-8 файл рядом с целевым и заменяет его rename после flush.
 * @param target - Абсолютный целевой путь
 * @param content - Точный текст
 * @param allowedRoot - Разрешённая корневая папка
 * @returns Квитанция после проверки содержимого
 */
export async function atomicWriteVerified(target: string, content: string, allowedRoot: string): Promise<LocalFileReceipt> {
 const parent = path.dirname(target);
 await fs.mkdir(allowedRoot, { recursive: true });
 const root = await fs.realpath(allowedRoot);
 let ancestor = parent;
 while (true) {
  try {
   const realAncestor = await fs.realpath(ancestor);
   const relativeAncestor = path.relative(root, realAncestor);
   if (relativeAncestor.startsWith('..') || path.isAbsolute(relativeAncestor)) throw new Error('Путь вне разрешённого каталога');
   break;
  } catch (error) {
   if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
   const next = path.dirname(ancestor);
   if (next === ancestor) throw error;
   ancestor = next;
  }
 }
 await fs.mkdir(parent, { recursive: true });
 const realParent = await fs.realpath(parent);
 const relative = path.relative(root, realParent);
 if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Путь вне разрешённого каталога');
 const temporary = path.join(realParent, `.${path.basename(target)}.${randomUUID()}.tmp`);
 let renamed = false;
 try {
  const handle = await fs.open(temporary, 'wx', 0o600);
  try { await handle.writeFile(content, 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  await fs.rename(temporary, target);
  renamed = true;
  if (await fs.readFile(target, 'utf8') !== content) throw new Error('Содержимое файла изменилось после записи');
  return { effect: 'local_file', outcome: 'saved', persistence: { confirmed: true, method: 'readback', sha256: createHash('sha256').update(content).digest('hex') } };
 } catch (cause) {
  const error = new Error(renamed ? 'Файл заменён, но проверка результата не завершена; перечитайте его перед повтором' : `Файл не заменён: ${(cause as Error).message}`);
  Object.assign(error, { outcome: renamed ? 'unknown' : 'error' });
  throw error;
 } finally { await fs.unlink(temporary).catch(() => undefined); }
}
