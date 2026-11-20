/** @fileoverview Буквальный поиск сохранённых сообщений с изоляцией ботов и курсором. */
import { z } from 'zod';
import { decodeMessageCursor } from './message-pagination';
import { dialogMessageSelect } from './message-select';
import { messagePeriodFields, messagePeriodSchema } from '../../../shared/message-period';

/** Параметры поиска по сохранённому тексту. */
export const dialogSearchParams = z.object({
  ...messagePeriodFields,
  /** Токен отдельного бота; отсутствует только в общей личной истории. */
  tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  /** Явное включение общей личной истории без подстановки бота по умолчанию. */
  allBots: z.enum(['true', 'false']).optional().transform(value => value === 'true'),
  /** Буквальная непустая подстрока. */
  query: z.string().trim().max(200).default(''),
  /** Необязательное ограничение конкретным чатом. */
  chatId: z.string().regex(/^-?[1-9]\d{0,19}$/).optional(),
  /** Тип чата; обязателен при указании чата. */
  chatType: z.enum(['private', 'group', 'supergroup', 'channel']).optional(),
  /** Размер страницы, по умолчанию десять результатов. */
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Продолжение к более старым совпадениям. */
  cursor: z.string().max(2048).optional(),
}).refine(value => !value.chatId || !!value.chatType)
  .refine(value => value.allBots
    ? value.tokenId === undefined && value.chatType === 'private' && /^[1-9]\d{0,19}$/.test(value.chatId ?? '')
    : value.tokenId !== undefined, 'Укажите бота либо общую личную переписку')
  .refine(value => Boolean(value.query || value.messageFrom || value.messageTo), 'Укажите текст или период сообщений')
  .refine(value => messagePeriodSchema.safeParse(value).success, 'Некорректный период сообщений');

/**
 * Создаёт параметризованный поиск, где спецсимволы совпадают буквально.
 * @param projectId - Проект
 * @param options - Проверенные фильтры
 * @returns SQL, значения и область курсора
 */
export function buildDialogSearchQuery(projectId: number, options: z.infer<typeof dialogSearchParams>) {
  const scope = JSON.stringify(['search', projectId, options.allBots ? 'all' : options.tokenId, options.query, options.chatId ?? null, options.chatType ?? null,
    options.messageFrom ?? null, options.messageTo ?? null]);
  const position = decodeMessageCursor(options.cursor, scope);
  const pattern = `%${options.query.replace(/[\\%_]/g, '\\$&')}%`;
  const values: unknown[] = [projectId, options.allBots ? null : options.tokenId, pattern, options.chatId ?? null, options.chatType ?? null];
  let sql = `${dialogMessageSelect}
    WHERE m.project_id = $1 AND ($2::integer IS NULL OR m.token_id = $2)
      AND COALESCE(m.message_text,'') ILIKE $3 ESCAPE E'\\\\'
      AND COALESCE(m.chat_type, 'private') IN ('private', 'group', 'supergroup', 'channel')
      AND ($5::text IS NULL OR COALESCE(m.chat_type, 'private') = $5)
      AND ($4::text IS NULL OR ($5 = 'private' AND m.user_id = $4)
        OR ($5 <> 'private' AND m.chat_id = $4))`;
  if (position) {
    values.push(position.time, position.id);
    sql += ` AND ((m.created_at IS NULL AND $6::timestamptz IS NOT NULL)
      OR date_trunc('milliseconds', m.created_at) < $6::timestamptz
      OR (date_trunc('milliseconds', m.created_at) IS NOT DISTINCT FROM $6::timestamptz AND m.id < $7::int))`;
  }
  /** Даты сравниваются с UTC, в котором хранится created_at без часового пояса. */
  for (const [value, operator] of [[options.messageFrom, '>='], [options.messageTo, '<=']] as const) {
    if (value) { values.push(value); sql += ` AND m.created_at ${operator} ($${values.length}::timestamptz AT TIME ZONE 'UTC')`; }
  }
  values.push(options.limit + 1);
  sql += ` ORDER BY date_trunc('milliseconds', m.created_at) DESC NULLS LAST, m.id DESC LIMIT $${values.length}`;
  return { sql, values, scope };
}
