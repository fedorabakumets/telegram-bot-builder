/** @fileoverview Проверка параметров и курсоров списка диалогов. */
import { z } from 'zod';

/** Параметры авторизованного HTTP-запроса. */
export const dialogParams = z.object({
  /** Обязательный идентификатор бота. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  /** Фильтр по типу чата. */
  kind: z.enum(['all', 'users', 'groups', 'channels']).default('all'),
  /** Поиск по сохранённым данным. */
  search: z.string().max(200).default(''),
  /** Размер страницы: по умолчанию 10 последних диалогов. */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Курсор следующей страницы. */
  cursor: z.string().max(2048).optional(),
});

/** Проверяемая позиция сортировки. */
const positionSchema = z.object({
  /** Область и фильтры запроса. */
  scope: z.string(),
  /** Время активности последнего диалога. */
  time: z.string().datetime().nullable(),
  /** Тип последнего чата. */
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  /** Идентификатор последнего чата. */
  id: z.string().regex(/^-?\d+$/),
});

/**
 * Декодирует курсор и запрещает использовать его с другими фильтрами.
 * @param cursor - Непрозрачный курсор
 * @param scope - Текущая область запроса
 * @returns Позиция или отсутствие курсора
 */
export function decodeDialogCursor(cursor: string | undefined, scope: string) {
  if (!cursor) return null;
  const value = positionSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  if (value.scope !== scope) throw new Error('Курсор относится к другим фильтрам');
  return value;
}

/**
 * Кодирует проверенную позицию сортировки.
 * @param position - Позиция следующей страницы
 * @returns Непрозрачный курсор
 */
export function encodeDialogCursor(position: z.infer<typeof positionSchema>): string {
  return Buffer.from(JSON.stringify(position)).toString('base64url');
}
