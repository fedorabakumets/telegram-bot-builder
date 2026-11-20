/** @fileoverview Параметризованная проверка наличия личных сообщений в выбранный период. */
import type { MessagePeriod } from '@shared/message-period';
import { userDirectorySearchPattern, userDirectorySearchSql } from './user-directory-search';

/**
 * Ограничивает список по дате самих сообщений, а не последней активности профиля.
 * @param period - Проверенные границы времени
 * @param params - Общий список параметров запроса
 * @param search - Поисковая строка списка для совпадения в том же периоде
 * @returns Условие наличия сообщения либо отсутствие ограничения
 */
export function userMessagePeriodSql(period: MessagePeriod, params: unknown[], search?: string): string {
  if (!period.messageFrom && !period.messageTo) return '';
  const conditions = ["bm.project_id=u.project_id", "bm.token_id=u.token_id", "bm.user_id=u.user_id::text", "COALESCE(bm.chat_type,'private')='private'"];
  for (const [value, operator] of [[period.messageFrom, '>='], [period.messageTo, '<=']] as const) {
    if (value) { params.push(value); conditions.push(`bm.created_at ${operator} ($${params.length}::timestamptz AT TIME ZONE 'UTC')`); }
  }
  if (search?.trim()) {
    params.push(userDirectorySearchPattern(search));
    conditions.push(`(bm.message_text ILIKE $${params.length} OR ${userDirectorySearchSql(params.length)})`);
  }
  return `EXISTS (SELECT 1 FROM bot_messages bm WHERE ${conditions.join(' AND ')})`;
}
