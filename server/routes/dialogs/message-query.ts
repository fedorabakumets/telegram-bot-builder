/** @fileoverview Изолированная SQL-выборка истории с устойчивой пагинацией по времени и ID. */
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
  let sql = `SELECT m.id, m.user_id, m.message_type, m.message_text, m.message_data,
    m.telegram_message_id, COALESCE(m.chat_type, 'private') AS chat_type,
    COALESCE(m.chat_id, m.user_id) AS chat_id, date_trunc('milliseconds', m.created_at) AS created_at,
    bg.name AS source_chat_title, COALESCE(media.items, '[]'::jsonb) AS media
    FROM bot_messages m LEFT JOIN LATERAL (
      SELECT name FROM bot_groups WHERE project_id = m.project_id AND token_id = m.token_id
        AND group_id = m.chat_id ORDER BY id DESC LIMIT 1
    ) bg ON m.chat_type IN ('group', 'supergroup', 'channel')
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('id', f.id, 'file_name', f.file_name,
        'file_type', f.file_type, 'file_size', f.file_size, 'mime_type', f.mime_type,
        'media_kind', mm.media_kind, 'order_index', mm.order_index)
        ORDER BY mm.order_index, mm.id) AS items
      FROM bot_message_media mm JOIN media_files f ON f.id = mm.media_file_id
      WHERE mm.message_id = m.id AND f.project_id = m.project_id
    ) media ON true
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
