/** @fileoverview Сборка переносимого архива Python-бота и оригиналов его медиа. */
import { zipSync, strToU8 } from 'fflate';
import { resolveRuntimeMedia, openRuntimeMedia } from '../../../storage/resolve-runtime-media';
import { uploadKeyFromUrl } from '../../../storage/uploads-storage';
import { storage } from '../../../storages/storage';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';
import { collectRuntimeMediaUrls } from '../../../bots/mediaRuntimeEnv';

/** Максимальный суммарный объём оригиналов в архиве. */
const MAX_BYTES = 128 * 1024 * 1024;

/**
 * Заменяет зарегистрированные старые адреса переносимыми адресами архива.
 * @param projectId - Идентификатор проекта
 * @param data - Данные проекта
 * @returns Копия данных и соответствие переносимых адресов оригиналам
 */
export async function prepareArchiveMedia(projectId: number, data: unknown): Promise<{ data: unknown; sources: Record<string, string> }> {
  const candidates = [...collectRuntimeMediaUrls(data)];
  const rows = candidates.length ? await storage.getMediaFilesByUrls(candidates, projectId) : [];
  const registered = new Set(rows.filter(row => row.projectId === projectId).map(row => row.url));
  for (const url of candidates) {
    if (registered.has(url) || !/^https?:\/\//i.test(url)) continue;
    try { await resolveRuntimeMedia(projectId, url); }
    catch (error) {
      if ((error as { code?: string }).code === 'MEDIA_NOT_MANAGED') continue;
      throw error;
    }
    throw new Error('Неоднозначная запись медиа проекта');
  }
  const sources: Record<string, string> = {};
  const rewrite = (value: unknown): unknown => {
    if (typeof value === 'string') {
      const managed = value.startsWith('/uploads/') || /^\/api\/(?:storage\/proxy|media\/s3-proxy)\//.test(value);
      if (!managed && !registered.has(value)) return value;
      if (!registered.has(value)) throw new Error('Медиафайл проекта не зарегистрирован');
      if (value.startsWith('/uploads/')) { sources[value] = value; return value; }
      let name = value;
      try { name = new URL(value, 'https://example.invalid').pathname; } catch { /* Сохраняем исходное имя */ }
      const ext = extname(name).toLowerCase();
      const suffix = /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '';
      const portable = `/uploads/${projectId}/export-${createHash('sha256').update(value).digest('hex')}${suffix}`;
      sources[portable] = value;
      return portable;
    }
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [rewrite(key), rewrite(item)]));
    return value;
  };
  return { data: rewrite(data), sources };
}

/**
 * Находит логические адреса в значениях и ключах данных проекта.
 * @param value - Данные проекта
 * @param urls - Найденные адреса
 * @returns Множество адресов
 */
function collectMedia(value: unknown, urls = new Set<string>()): Set<string> {
  if (typeof value === 'string' && value.startsWith('/uploads/')) urls.add(value);
  else if (Array.isArray(value)) value.forEach(item => collectMedia(item, urls));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) { collectMedia(key, urls); collectMedia(item, urls); }
  }
  return urls;
}

/**
 * Создаёт архив без секретов, включая все зарегистрированные оригиналы проекта.
 * @param projectId - Идентификатор проекта
 * @param data - Данные проекта
 * @param code - Сгенерированный Python
 * @param sources - Соответствие переносимых адресов зарегистрированным оригиналам
 * @returns Готовый архив ZIP
 */
export async function exportProjectArchive(projectId: number, data: unknown, code: string, sources: Record<string, string> = {}): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = { 'bot.py': strToU8(code) };
  const manifest: Array<{ url: string; path: string; size: number; version: string }> = [];
  let total = 0;
  for (const url of collectMedia(data)) {
    const key = uploadKeyFromUrl(url);
    if (!key) throw new Error('Некорректный адрес медиа в проекте');
    const resolved = await resolveRuntimeMedia(projectId, sources[url] ?? url);
    const object = await openRuntimeMedia(resolved);
    try {
      if (!Number.isSafeInteger(object.size) || object.size < 0 || total + object.size > MAX_BYTES) throw new Error('Размер медиа превышает лимит экспорта');
      const chunks: Buffer[] = [];
      let length = 0;
      const stream = await object.stream();
      for await (const chunk of stream) {
        const bytes = Buffer.from(chunk);
        length += bytes.length;
        if (length > object.size || total + length > MAX_BYTES) throw new Error('Размер медиа превышает лимит экспорта');
        chunks.push(bytes);
      }
      if (length !== object.size) throw new Error('Получен неполный медиафайл');
      const path = `uploads/${key}`;
      if (files[path]) throw new Error('Повторяющийся путь медиа в архиве');
      files[path] = Buffer.concat(chunks, length);
      manifest.push({ url, path, size: length, version: object.version });
      total += length;
    } finally { await object.close?.().catch(() => undefined); }
  }
  files['manifest.json'] = strToU8(JSON.stringify({ version: 1, projectId, media: manifest }, null, 2));
  files['README.txt'] = strToU8('Запустите bot.py рядом с папкой uploads. Установите зависимости бота и задайте BOT_TOKEN.\n');
  return zipSync(files, { level: 6 });
}
