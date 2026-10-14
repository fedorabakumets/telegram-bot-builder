/** @fileoverview Поиск и стабильная пагинация SQL списка диалогов. */
import type { z } from 'zod';
import { DIALOG_QUERY } from './dialog-query';
import { dialogParams, decodeDialogCursor } from './dialog-pagination';

/**
 * Формирует параметризованный запрос с проверенным курсором.
 * @param projectId - Идентификатор проекта
 * @param options - Проверенные параметры запроса
 * @returns SQL, параметры и область курсора
 */
export function buildDialogListQuery(projectId: number, options: z.infer<typeof dialogParams>) {
  const { tokenId, kind, search, limit, cursor } = options;
  const scope = JSON.stringify([projectId, tokenId, kind, search]);
  const position = decodeDialogCursor(cursor, scope);
  const values: unknown[] = [projectId, tokenId, kind, `%${search.replace(/[\\%_]/g, '\\$&')}%`];
  let sql = `${DIALOG_QUERY} WHERE ($3 = 'all'
    OR ($3 = 'users' AND chat_type = 'private')
    OR ($3 = 'groups' AND chat_type IN ('group', 'supergroup'))
    OR ($3 = 'channels' AND chat_type = 'channel'))
    AND (display_name ILIKE $4 OR COALESCE(username, '') ILIKE $4 OR chat_id ILIKE $4)`;
  if (position) {
    values.push(position.time, position.type, position.id);
    sql += ` AND ((last_activity_at IS NULL AND $5::timestamptz IS NOT NULL)
      OR last_activity_at < $5::timestamptz
      OR (last_activity_at IS NOT DISTINCT FROM $5::timestamptz
        AND (chat_type, chat_id) > ($6::text, $7::text)))`;
  }
  values.push(limit + 1);
  sql += ` ORDER BY last_activity_at DESC NULLS LAST, chat_type, chat_id LIMIT $${values.length}`;
  return { sql, values, scope };
}
