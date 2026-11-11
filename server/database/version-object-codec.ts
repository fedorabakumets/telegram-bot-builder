/**
 * @fileoverview Кодирование и проверка сжатых снимков версий проекта.
 */
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { ProjectVersion } from '@shared/schema';

/**
 * Вычисляет SHA-256 исходного JSON снимка.
 * @param snapshot - Данные проекта
 * @returns Буфер JSON и контрольная сумма
 */
export function snapshotDigest(snapshot: unknown): { json: Buffer; sha256: string } {
  const json = Buffer.from(JSON.stringify(snapshot));
  return { json, sha256: createHash('sha256').update(json).digest('hex') };
}

/**
 * Сжимает снимок для размещения в объектном хранилище.
 * @param snapshot - Данные проекта
 * @returns Сжатый буфер, исходный размер и контрольная сумма
 */
export function encodeSnapshot(snapshot: unknown): { body: Buffer; bytes: number; sha256: string } {
  const { json, sha256 } = snapshotDigest(snapshot);
  return { body: gzipSync(json), bytes: json.length, sha256 };
}

/**
 * Читает поток объекта с ограничением размера и проверяет целостность JSON.
 * @param stream - Поток сжатого объекта
 * @param version - Метаданные ожидаемого снимка
 * @returns Проверенный JSON проекта
 */
export async function decodeSnapshot(stream: NodeJS.ReadableStream, version: ProjectVersion): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 128 * 1024 * 1024) throw new Error('Снимок версии превышает допустимый размер');
    chunks.push(buffer);
  }
  const json = gunzipSync(Buffer.concat(chunks), { maxOutputLength: 256 * 1024 * 1024 });
  const digest = createHash('sha256').update(json).digest('hex');
  if (json.length !== version.snapshotBytes || digest !== version.snapshotSha256) {
    throw new Error('Контрольная сумма снимка версии не совпадает');
  }
  return JSON.parse(json.toString('utf8'));
}
