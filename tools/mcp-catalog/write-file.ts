/** @fileoverview Атомарная замена генерируемого документа с ограниченным повтором временных блокировок Windows. */
import { writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

/**
 * Не оставляет обрезанный документ при прерванной записи и не повторяет действия приложения.
 * @param file - Полный путь генерируемого документа.
 * @param content - Полное содержимое.
 */
export async function writeGeneratedFile(file: string, content: string): Promise<void> {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    for (let attempt = 0; ; attempt++) {
      try { await rename(temporary, file); return; }
      catch (error) {
        if (attempt >= 3 || !['EPERM', 'EBUSY', 'EACCES', 'UNKNOWN'].includes(String((error as NodeJS.ErrnoException).code))) throw error;
        await setTimeout(100 * (attempt + 1));
      }
    }
  } finally { await rm(temporary, { force: true }).catch(() => undefined); }
}
