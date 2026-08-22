/**
 * @fileoverview Метаданные сгенерированного кода рядом с папкой бота
 * @module server/files/generatedCodeMeta
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Имя файла метаданных в папке бота */
export const GENERATED_CODE_META_FILENAME = '.generated-code.json';

/** Содержимое .generated-code.json */
export interface GeneratedCodeMeta {
  fingerprint: string;
  projectId: number;
  tokenId: number;
  writtenAt: string;
}

/**
 * Читает метаданные генерации. Никогда не бросает исключение.
 * @param botDir - Папка бота (bots/name_projectId_tokenId)
 * @returns Meta или null
 */
export function readGeneratedCodeMeta(botDir: string): GeneratedCodeMeta | null {
  try {
    const raw = readFileSync(join(botDir, GENERATED_CODE_META_FILENAME), 'utf8');
    const parsed = JSON.parse(raw) as Partial<GeneratedCodeMeta>;
    if (
      typeof parsed.fingerprint !== 'string' ||
      typeof parsed.projectId !== 'number' ||
      typeof parsed.tokenId !== 'number'
    ) {
      return null;
    }
    return {
      fingerprint: parsed.fingerprint,
      projectId: parsed.projectId,
      tokenId: parsed.tokenId,
      writtenAt: typeof parsed.writtenAt === 'string' ? parsed.writtenAt : '',
    };
  } catch {
    return null;
  }
}

/**
 * Записывает метаданные после успешной генерации кода.
 * @param botDir - Папка бота
 * @param meta - Отпечаток и идентификаторы
 */
export function writeGeneratedCodeMeta(botDir: string, meta: GeneratedCodeMeta): void {
  mkdirSync(botDir, { recursive: true });
  writeFileSync(
    join(botDir, GENERATED_CODE_META_FILENAME),
    JSON.stringify(meta, null, 2),
    'utf8',
  );
}
