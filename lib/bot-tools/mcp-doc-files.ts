/**
 * @fileoverview Безопасное чтение и полнотекстовый поиск карточек MCP по известным идентификаторам.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Возвращает только обычные Markdown-файлы каталога, исключая ссылки и служебный индекс.
 * @param directory - Каталог документации.
 * @returns Отсортированный список разрешённых файлов.
 */
async function listDocFiles(directory: string): Promise<string[]> {
  return (await readdir(directory, { withFileTypes: true }).catch(() => []))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
    .map((entry) => entry.name).sort();
}

/** Возвращает идентификаторы разрешённых карточек.
 * @param directory - Каталог документации.
 * @returns Идентификаторы обычных файлов без расширения.
 */
export async function listKnownDocIds(directory: string): Promise<string[]> {
  return (await listDocFiles(directory)).map((file) => file.slice(0, -3));
}

/** Читает карточку только при точном совпадении идентификатора с известным файлом.
 * @param directory - Каталог документации.
 * @param id - Идентификатор без расширения и компонентов пути.
 * @returns Текст разрешённой карточки либо отсутствие результата.
 */
export async function readKnownDoc(directory: string, id: string): Promise<string | undefined> {
  if (!id || /[\\/]/.test(id) || id === '.' || id === '..') return undefined;
  const files = await listDocFiles(directory);
  const file = files.find((name) => name.slice(0, -3) === id);
  return file ? readFile(join(directory, file), 'utf8').catch(() => undefined) : undefined;
}

/** Ищет по имени и содержимому всех разрешённых карточек каталога.
 * @param directory - Каталог документации.
 * @param query - Поисковый запрос.
 * @returns Идентификаторы найденных карточек в стабильном порядке.
 */
export async function searchKnownDocs(directory: string, query: string): Promise<string[]> {
  const normalized = query.trim().toLocaleLowerCase('ru');
  if (!normalized) return [];
  const matches = await Promise.all((await listDocFiles(directory)).map(async (file) => {
    const content = await readFile(join(directory, file), 'utf8').catch(() => '');
    return `${file}\n${content}`.toLocaleLowerCase('ru').includes(normalized) ? file.slice(0, -3) : undefined;
  }));
  return matches.filter((id): id is string => id !== undefined);
}
