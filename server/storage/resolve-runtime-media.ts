/** @fileoverview Разрешение зарегистрированного медиа проекта для рабочего процесса бота. */
import { createHash } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import { open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { mediaFiles, storageConfigs } from '@shared/schema';
import { db } from '../database/db';
import { storage } from '../storages/storage';
import { ensureStorageRegistryLoaded } from './storage-registry';
import { uploadKeyFromUrl } from './uploads-storage';
import { S3Backend } from './s3-backend';
import { openWindowsMedia } from './windows-media-read';

/** Находит запись файла строго в указанном проекте и её хранилище.
 * @param projectId - Идентификатор проекта
 * @param url - Логический относительный адрес файла
 * @returns Запись и бэкенд файла
 */
export async function resolveRuntimeMedia(projectId: number, url: string, deps = { storage, ensureStorageRegistryLoaded, isRegisteredMediaUrl }) {
  const key = uploadKeyFromUrl(url);
  const relativeProxy = /^\/api\/(?:media\/s3-proxy|storage\/proxy)\//.test(url);
  let absolute = false;
  try { const parsed = new URL(url); absolute = ['http:', 'https:'].includes(parsed.protocol); } catch { /* относительный адрес */ }
  if ((!key && !relativeProxy && !absolute) || /[\u0000-\u001f\\]/.test(url) || url.length > 8192) throw Object.assign(new Error('Недопустимый адрес медиа'), { status: 404 });
  const rows = await deps.storage.getMediaFilesByUrls([url], projectId);
  if (rows.length !== 1 || rows[0].projectId !== projectId || rows[0].url !== url) {
    const registered = absolute && await deps.isRegisteredMediaUrl(url);
    throw Object.assign(new Error('Медиафайл не найден'), { status: 404, code: absolute && !registered ? 'MEDIA_NOT_MANAGED' : 'MEDIA_NOT_FOUND' });
  }
  const media = rows[0];
  const registry = await deps.ensureStorageRegistryLoaded();
  const backend = registry.list().find(item => item.configId === (media.storageConfigId ?? 'local-default'));
  if (!backend || backend.backend !== (media.storageBackend ?? 'local')) throw Object.assign(new Error('Хранилище недоступно'), { status: 502 });
  return { media, backend, key: key ?? '' };
}

/** Проверяет, зарегистрирован ли адрес как файл любого проекта.
 * @param url - Точный адрес файла
 * @returns Признак существования записи
 */
async function isRegisteredMediaUrl(url: string): Promise<boolean> {
  const rows = await db.select({ id: mediaFiles.id }).from(mediaFiles).where(eq(mediaFiles.url, url)).limit(1);
  return rows.length > 0;
}

/** Открывает оригинал и получает его версию для кэша.
 * @param resolved - Проверенная запись проекта
 * @returns Поток, размер и версия объекта
 */
export async function openRuntimeMedia(resolved: Awaited<ReturnType<typeof resolveRuntimeMedia>>, signal?: AbortSignal) {
  const { media, backend } = resolved;
  if (backend instanceof S3Backend) {
    const key = uploadKeyFromUrl(`/uploads/${media.filePath}`);
    if (!key) throw Object.assign(new Error('Недопустимый ключ'), { status: 404 });
    const meta = await backend.headMetadata(key, signal);
    return { size: meta.size, version: meta.version, stream: () => backend.getIfMatch(key, meta.etag, signal), mime: media.mimeType };
  }
  if (process.platform !== 'linux' && process.platform !== 'win32') throw Object.assign(new Error('Безопасное открытие локального файла недоступно'), { status: 502 });
  const configs = await db.select().from(storageConfigs).where(eq(storageConfigs.id, backend.configId)).limit(1);
  const config = configs[0]?.config as { rootPath?: string } | undefined;
  const root = await realpath(path.resolve(config?.rootPath || 'uploads'));
  const recorded = media.filePath;
  const legacyPath = backend.configId === 'local-default' && /^uploads[/\\]/.test(recorded);
  const target = await realpath(path.isAbsolute(recorded) || legacyPath ? path.resolve(recorded) : path.resolve(root, recorded));
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw Object.assign(new Error('Недопустимый путь'), { status: 404 });
  if (process.platform === 'win32') {
    const metadata = await openWindowsMedia(root, target, 'head', '', signal);
    for await (const _chunk of metadata.stream) { /* ожидание завершения проверки */ }
    return { size: metadata.size, version: metadata.version, mime: media.mimeType,
      stream: async () => (await openWindowsMedia(root, target, 'read', metadata.version, signal)).stream };
  }
  const handle = await open(target, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  const stat = await handle.stat();
  // Проверяем именно открытый дескриптор: промежуточный каталог мог смениться после realpath.
  const opened = await realpath(`/proc/self/fd/${handle.fd}`);
  const openedRelative = path.relative(root, opened);
  if (!openedRelative || openedRelative.startsWith('..') || path.isAbsolute(openedRelative)) {
    await handle.close();
    throw Object.assign(new Error('Недопустимый путь'), { status: 404 });
  }
  if (!stat.isFile()) { await handle.close(); throw Object.assign(new Error('Медиафайл не найден'), { status: 404 }); }
  return { size: stat.size, version: `${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`,
    stream: async () => createReadStream('', { fd: handle.fd, autoClose: true }), close: () => handle.close(), mime: media.mimeType };
}

/** Формирует безопасный HTTP ETag из версии объекта.
 * @param version - Версия объекта хранилища
 * @returns ETag объекта
 */
export function runtimeMediaEtag(version: string): string {
  return `"${createHash('sha256').update(version).digest('hex')}"`;
}
