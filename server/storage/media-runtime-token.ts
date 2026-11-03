/** @fileoverview Создание отдельного токена чтения медиа для проекта. */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Создаёт токен проекта из серверного секрета.
 * @param projectId - Идентификатор проекта
 * @returns Токен доступа к медиа проекта
 */
export function createMediaRuntimeToken(projectId: number): string {
  const secret = process.env.MEDIA_RUNTIME_SECRET;
  if (!secret || secret.length < 32) throw new Error('MEDIA_RUNTIME_SECRET должен содержать не менее 32 символов');
  if (!Number.isSafeInteger(projectId) || projectId < 1) throw new Error('Недопустимый проект');
  return createHmac('sha256', secret).update(`media-project:${projectId}`).digest('hex');
}

/** Проверяет токен проекта без сравнения по времени.
 * @param projectId - Идентификатор проекта
 * @param token - Представленный токен
 * @returns Признак совпадения
 */
export function verifyMediaRuntimeToken(projectId: number, token: string): boolean {
  const expected = Buffer.from(createMediaRuntimeToken(projectId), 'hex');
  if (!/^[0-9a-f]{64}$/i.test(token)) return false;
  return timingSafeEqual(expected, Buffer.from(token, 'hex'));
}
/** Создаёт отдельный токен приёма файлов проекта.
 * @param projectId - Идентификатор проекта
 * @returns Токен записи входящего фото
 */
export function createMediaRuntimeWriteToken(projectId: number): string {
  const secret = process.env.MEDIA_RUNTIME_SECRET;
  if (!secret || secret.length < 32) throw new Error('MEDIA_RUNTIME_SECRET должен содержать не менее 32 символов');
  if (!Number.isSafeInteger(projectId) || projectId < 1) throw new Error('Недопустимый проект');
  return createHmac('sha256', secret).update(`media-write-project:${projectId}`).digest('hex');
}

/** Проверяет отдельный токен приёма входящего фото.
 * @param projectId - Идентификатор проекта
 * @param token - Представленный токен
 * @returns Признак совпадения
 */
export function verifyMediaRuntimeWriteToken(projectId: number, token: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(token)) return false;
  return timingSafeEqual(Buffer.from(createMediaRuntimeWriteToken(projectId), 'hex'), Buffer.from(token, 'hex'));
}
