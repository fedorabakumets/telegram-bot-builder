/** @fileoverview Изолированная SQL-выборка истории с устойчивой пагинацией по времени и ID. */
import { dialogMessageSelect } from './message-select';
import type { z } from 'zod';
import { decodeMessageCursor, dialogMessageParams } from './message-pagination';

/**
 * Собирает запрос последних сообщений с безопасными метаданными сохранённых медиа.
 * @param projectId - Проект
 * @param chatId - Идентификатор Telegram
 * @param options - Проверенные параметры
 * @returns SQL, значения параметров и область курсора
 */
export function buildDialogMessageQuery(projectId: number, chatId: string,
  options: z.infer<typeof dialogMessageParams>) {
  const scope = JSON.stringify([projectId, options.tokenId, chatId, options.chatType, options.includeGroupContext]);
  const position = decodeMessageCursor(options.cursor, scope);
  const values: unknown[] = [projectId, options.tokenId, chatId, options.chatType, options.includeGroupContext];
  let sql = `${dialogMessageSelect}
    WHERE m.project_id = $1 AND m.token_id = $2 AND (
      ($4 = 'private' AND m.user_id = $3 AND (COALESCE(m.chat_type, 'private') = 'private'
        OR ($5::boolean AND m.chat_type IN ('group', 'supergroup') AND m.message_type = 'user')))
      OR ($4 <> 'private' AND m.chat_id = $3 AND m.chat_type = $4))`;
  if (position) {
    values.push(position.time, position.id);
    sql += ` AND ((m.created_at IS NULL AND $6::timestamptz IS NOT NULL)
      OR date_trunc('milliseconds', m.created_at) < $6::timestamptz
      OR (date_trunc('milliseconds', m.created_at) IS NOT DISTINCT FROM $6::timestamptz AND m.id < $7::int))`;
  }
  values.push(options.limit + 1);
  sql += ` ORDER BY date_trunc('milliseconds', m.created_at) DESC NULLS LAST, m.id DESC LIMIT $${values.length}`;
  return { sql, values, scope };
}
