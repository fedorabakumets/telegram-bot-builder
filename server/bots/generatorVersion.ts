/**
 * @fileoverview Версия создателя кода бота — контрольная сумма по содержимому шаблонов
 * @module server/bots/generatorVersion
 */

import { createHash } from 'node:crypto';
import { createReadStream, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Каталоги и файлы, влияющие на generatePythonCode */
const GENERATOR_PATHS = [
  'lib/bot-generator',
  'lib/templates',
  'lib/scaffolding',
  'shared/scaffolding-wrapper.ts',
  'server/utils/normalizeProjectData.ts',
] as const;

let cachedVersion: string | null = null;

/**
 * Рекурсивно собирает пути всех файлов в каталоге.
 * @param dir - Абсолютный путь к каталогу
 * @returns Отсортированный список абсолютных путей
 */
function listFilesRecursive(dir: string): string[] {
  const result: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return result;
  }
  for (const name of entries.sort()) {
    const full = join(dir, name);
    try {
      const st = statSync(full);
      if (st.isDirectory()) {
        result.push(...listFilesRecursive(full));
      } else if (st.isFile()) {
        result.push(full);
      }
    } catch {
      // пропускаем недоступные
    }
  }
  return result;
}

/**
 * sha256 содержимого файла (потоково).
 * @param filePath - Путь к файлу
 * @returns hex digest
 */
function hashFileContent(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Считает контрольную сумму всех файлов генератора по содержимому.
 * Результат кэшируется в памяти процесса.
 * @returns hex sha256
 */
export async function getGeneratorVersion(): Promise<string> {
  if (cachedVersion !== null) {
    return cachedVersion;
  }

  const root = process.cwd();
  const pairs: string[] = [];

  for (const rel of GENERATOR_PATHS) {
    const abs = join(root, rel);
    try {
      const st = statSync(abs);
      if (st.isFile()) {
        const digest = await hashFileContent(abs);
        pairs.push(`${rel}:${digest}`);
      } else if (st.isDirectory()) {
        for (const file of listFilesRecursive(abs)) {
          const relFile = file.slice(root.length + 1).replace(/\\/g, '/');
          const digest = await hashFileContent(file);
          pairs.push(`${relFile}:${digest}`);
        }
      }
    } catch {
      // каталог/файл может отсутствовать в тестовом окружении
    }
  }

  pairs.sort();
  cachedVersion = createHash('sha256').update(pairs.join('\n')).digest('hex');
  return cachedVersion;
}

/**
 * Сброс кэша (только для тестов).
 */
export function resetGeneratorVersionCache(): void {
  cachedVersion = null;
}
