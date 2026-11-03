/** @fileoverview Контракты медиа без путей файлов сервера и произвольного JSON. */
import { z } from 'zod';
/** Проверяет публичную форму HTTP ссылки; DNS и владение проверяет сервер. */
export function isPublicMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(url.hostname)
      && !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/i.test(url.hostname);
  } catch { return false; }
}
/** Допустимый непрозрачный Telegram file_id, никогда не локальный путь. */
export const telegramFileIdSchema = z.string().min(10).max(1024).regex(/^[A-Za-z0-9_-]+$/);
/** Строгая запись file_id с привязкой к токену. */
export const telegramFileReferenceSchema = z.object({
  /** Признак записи Telegram. */
  __type: z.literal('file_id'),
  /** Вид медиа. */
  mediaType: z.enum(['photo', 'video', 'audio', 'document', 'animation', 'voice', 'video_note', 'sticker']).optional(),
  /** Идентификаторы файлов по ботам. */
  fileIdsByToken: z.record(z.string().regex(/^[1-9]\d*$/), telegramFileIdSchema),
}).strict();
/** Проверяет безопасное представление медиа для удалённого MCP. */
export function isRemoteMediaReference(value: string): boolean {
  if (isPublicMediaUrl(value)) return true;
  try { return telegramFileReferenceSchema.safeParse(JSON.parse(value)).success; } catch { return false; }
}
/** Удалённая ссылка без файловых путей. */
export const remoteMediaReferenceSchema = z.string().max(16384).refine(isRemoteMediaReference, 'Ожидается публичный HTTP URL или строгая запись Telegram file_id');

/** Совместимая HTTP ссылка на загруженный актив; владение проверяется перед чтением. */
export const httpMediaReferenceSchema = z.string().max(16384).refine(value => isRemoteMediaReference(value)
  || value.startsWith('/uploads/') && !/[\\\x00-\x1f%?#]/.test(value)
    && value.split('/').slice(1).every(part => part.length > 0 && part !== '.' && part !== '..'), 'Недопустимая ссылка на медиа');
