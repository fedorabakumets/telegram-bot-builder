/** @fileoverview Проверка области и курсора чтения сохранённой истории диалога. */
import { z } from 'zod';

/** Параметры чтения истории без обращения к Telegram. */
export const dialogMessageParams = z.object({
  /** Обязательный токен выбранного бота. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  /** Тип исходного чата. */
  chatType: z.enum(['private', 'group', 'supergroup', 'channel']),
  /** Число сообщений: по умолчанию 10 последних записей. */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Включение входящих сообщений пользователя в группах. */
  includeGroupContext: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),
  /** Позиция следующей страницы. */
  cursor: z.string().max(2048).optional(),
}).refine(value => !value.includeGroupContext || value.chatType === 'private');

/** Проверяемая позиция истории. */
const positionSchema = z.object({
  /** Область проекта, бота, чата и контекста. */
  scope: z.string(),
  /** Дата последнего сообщения страницы или отсутствие даты. */
  time: z.string().datetime().nullable(),
  /** Идентификатор строки сохранённого сообщения. */
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

/**
 * Кодирует позицию последнего сообщения выбранной страницы.
 * @param position - Проверенная позиция
 * @returns Непрозрачный курсор
 */
export function encodeMessageCursor(position: z.infer<typeof positionSchema>): string {
  return Buffer.from(JSON.stringify(position)).toString('base64url');
}

/**
 * Проверяет курсор и запрещает перенос между областями истории.
 * @param cursor - Курсор продолжения
 * @param scope - Текущая область
 * @returns Позиция продолжения или отсутствие курсора
 */
export function decodeMessageCursor(cursor: string | undefined, scope: string) {
  if (!cursor) return null;
  const position = positionSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  if (position.scope !== scope) throw new Error('Курсор относится к другой истории');
  return position;
}
