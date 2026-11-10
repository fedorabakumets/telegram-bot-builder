/** @fileoverview Временный файл дампа, потоковая контрольная сумма и гарантированная очистка. */
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { mkdtemp, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/** Метаданные файла без загрузки его содержимого в память. */
export interface DumpFileInfo {
  /** Размер в байтах. */
  size: number;
  /** Контрольная сумма SHA-256. */
  sha256: string;
}

/**
 * Вычисляет контрольную сумму ограниченными порциями данных.
 * @param filePath - Путь завершённого дампа
 * @returns Размер и контрольная сумма
 */
export async function inspectDumpFile(filePath: string): Promise<DumpFileInfo> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return { size: (await stat(filePath)).size, sha256: hash.digest('hex') };
}

/**
 * Выделяет приватный каталог и удаляет его после завершения или ошибки операции.
 * @param operation - Создание, сохранение и доставка дампа
 * @returns Результат операции
 */
export async function withTemporaryDump<T>(operation: (filePath: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'tbb-db-backup-'));
  try {
    return await operation(join(directory, 'database.dump'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
