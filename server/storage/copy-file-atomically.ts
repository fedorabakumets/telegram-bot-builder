/**
 * @fileoverview Атомарная потоковая запись файла без загрузки содержимого в память.
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

/**
 * Копирует файл через временный объект рядом с назначением и атомарное переименование.
 * @param source - Путь исходного файла
 * @param destination - Путь назначения
 * @returns Число записанных байт
 */
export async function copyFileAtomically(source: string, destination: string): Promise<number> {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.part`;
  try {
    await pipeline(createReadStream(source), createWriteStream(temporary, { flags: 'wx', mode: 0o600 }));
    const { size } = await stat(temporary);
    await rename(temporary, destination);
    return size;
  } finally {
    await rm(temporary, { force: true });
  }
}
