/** @fileoverview Проверка владения медиа и канонического пути перед чтением или отправкой. */
import { realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { lookup } from 'node:dns/promises';
import { storage } from '../../../../storages/storage';
import { isPublicMediaUrl, telegramFileIdSchema } from '../../../../../shared/schema/media-reference-contracts';
/** Проверяет адрес DNS на отсутствие внутренних диапазонов. */
function isPublicAddress(value: string): boolean {
  if (value.includes(':')) return /^2[0-9a-f]{3}:/i.test(value) && !/^2001:(?:0:|db8:)/i.test(value);
  const parts = value.split('.').map(Number);
  return parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255)
    && ![0, 10, 127].includes(parts[0]) && parts[0] < 224
    && !(parts[0] === 169 && parts[1] === 254) && !(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    && !(parts[0] === 192 && [0, 168].includes(parts[1])) && !(parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    && !(parts[0] === 198 && [18, 19].includes(parts[1]));
}
/** Требует публичный URL или Telegram file_id; файловые схемы запрещены. */
export async function assertRemoteMediaReference(value: string): Promise<void> {
  if (telegramFileIdSchema.safeParse(value).success) return;
  if (!isPublicMediaUrl(value)) throw new Error('Недопустимая ссылка на медиа');
  const addresses = await lookup(new URL(value).hostname, { all: true });
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('Внутренний адрес медиа запрещён');
}
/** Подтверждает владение и containment до чтения байтов; закрывает traversal и symlink. */
export async function resolveOwnedMediaPath(value: string, projectId?: number): Promise<string> {
  if (!Number.isSafeInteger(projectId) || projectId! < 1 || /[\\\x00-\x1f%?#]/.test(value)) throw new Error('Недопустимый путь медиа');
  const normalized = value.startsWith('/') ? value.slice(1) : value;
  const parts = normalized.split('/');
  if (parts[0] !== 'uploads' || (parts.length > 2 && /^\d+$/.test(parts[1]) && parts[1] !== String(projectId)) || parts.some(part => !part || part === '.' || part === '..')) throw new Error('Медиа другого проекта или недопустимый путь');
  const records = await storage.getMediaFilesByUrls([value, `/${normalized}`, normalized], projectId!);
  if (!records.some(item => item.projectId === projectId && [item.url, item.filePath].includes(value))) throw new Error('Файл не принадлежит проекту');
  const root = realpathSync(resolve(process.cwd(), 'uploads'));
  const target = realpathSync(resolve(process.cwd(), normalized));
  const delta = relative(root, target);
  if (!delta || delta.startsWith('..') || isAbsolute(delta)) throw new Error('Путь медиа выходит за хранилище проекта');
  return target;
}
