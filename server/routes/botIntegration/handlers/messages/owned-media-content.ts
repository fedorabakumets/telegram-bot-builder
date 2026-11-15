/** @fileoverview Безопасное чтение вложений проекта из зарегистрированного локального или S3-хранилища. */
import { basename } from 'node:path';

/** Проверяет логический адрес вложения до обращения к хранилищу.
 * @param value - Адрес загруженного файла
 * @param projectId - Проект владельца
 * @returns Канонический логический адрес
 */
function ownedMediaUrl(value: string, projectId?: number): string {
  if (!Number.isSafeInteger(projectId) || projectId! < 1 || /[\\\x00-\x1f%?#]/.test(value)) throw new Error('Недопустимый путь медиа');
  const normalized = value.startsWith('/') ? value.slice(1) : value;
  const parts = normalized.split('/');
  if (parts[0] !== 'uploads' || parts.length < 2 || parts.some(part => !part || part === '.' || part === '..')
    || (parts.length > 2 && /^\d+$/.test(parts[1]) && parts[1] !== String(projectId))) {
    throw new Error('Медиа другого проекта или недопустимый путь');
  }
  return `/${normalized}`;
}

/** Открывает вложение через конфигурацию хранилища его записи, сохраняя проектную изоляцию.
 * @param value - Логический адрес файла
 * @param projectId - Проект владельца
 * @returns Метаданные и средство чтения оригинала
 */
async function openOwnedMedia(value: string, projectId?: number) {
  const url = ownedMediaUrl(value, projectId);
  const { resolveRuntimeMedia, openRuntimeMedia } = await import('../../../../storage/resolve-runtime-media');
  return openRuntimeMedia(await resolveRuntimeMedia(projectId!, url));
}

/** Проверяет доступность вложения, не отправляя сообщение и не скачивая объект S3.
 * @param value - Логический адрес файла
 * @param projectId - Проект владельца
 * @returns Завершение проверки существования и доступа
 */
export async function assertOwnedMediaAvailable(value: string, projectId?: number): Promise<void> {
  const opened = await openOwnedMedia(value, projectId);
  if ('close' in opened) await opened.close?.();
}

/** Читает оригинал вложения для multipart-запроса Telegram независимо от типа хранилища.
 * @param value - Логический адрес файла
 * @param projectId - Проект владельца
 * @returns Байты и имя файла
 */
export async function readOwnedMediaBuffer(value: string, projectId?: number): Promise<{ buffer: Buffer; fileName: string }> {
  const opened = await openOwnedMedia(value, projectId);
  try {
    const stream = await opened.stream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return { buffer: Buffer.concat(chunks), fileName: basename(value) };
  } finally {
    /** Поток Linux закрывает дескриптор сам; повторное закрытие FileHandle может вернуть EBADF. */
    if ('close' in opened) {
      try { await opened.close?.(); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EBADF') throw error; }
    }
  }
}
