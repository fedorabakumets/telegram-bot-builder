/** @fileoverview Подпись короткой ссылки на конкретный файл проекта для Telegram. */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Максимальный срок действия ссылки в секундах. */
export const INVOICE_LINK_TTL = 300;

/**
 * Подписывает проект, запись файла и срок действия отдельным назначением ключа.
 * @param projectId - Идентификатор проекта
 * @param mediaId - Идентификатор файла
 * @param expires - Время истечения в секундах
 * @returns Подпись ссылки
 */
export function signInvoiceMedia(projectId: number, mediaId: number, expires: number): string {
  const secret = process.env.MEDIA_RUNTIME_SECRET;
  if (!secret || secret.length < 32) throw new Error('Не настроен ключ медиа');
  return createHmac('sha256', secret).update(`invoice-media:${projectId}:${mediaId}:${expires}`).digest('hex');
}

/**
 * Проверяет подпись и ограниченный срок ссылки.
 * @param projectId - Идентификатор проекта
 * @param mediaId - Идентификатор файла
 * @param expires - Время истечения
 * @param signature - Подпись
 * @param now - Текущее время в секундах
 * @returns Признак допустимой ссылки
 */
export function verifyInvoiceMedia(projectId: number, mediaId: number, expires: number, signature: string, now = Math.floor(Date.now() / 1000)): boolean {
  if (![projectId, mediaId, expires].every(n => Number.isSafeInteger(n) && n > 0) || expires <= now || expires > now + INVOICE_LINK_TTL || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signInvoiceMedia(projectId, mediaId, expires), 'hex'), Buffer.from(signature, 'hex'));
}
