/** @fileoverview Запись и чтение результатов проверки доступа к чатам. */
import { pool as dbPool } from '../../database/db';

/**
 * Сохраняет результат, не меняя название и аватарку группы.
 * @param projectId - Проект
 * @param tokenId - Выбранный бот
 * @param chatId - Чат
 * @param status - Результат проверки
 * @returns Сохранённое состояние с временем
 */
export async function saveChatAccess(projectId: number, tokenId: number, chatId: string,
  status: 'available' | 'kicked' | 'error') {
  const result = await dbPool.query(`INSERT INTO chat_access (project_id, token_id, chat_id, status, checked_at)
    VALUES ($1, $2, $3, $4, now()) ON CONFLICT (project_id, token_id, chat_id)
    DO UPDATE SET status = EXCLUDED.status, checked_at = EXCLUDED.checked_at
    RETURNING status AS "accessStatus", checked_at AS "accessCheckedAt"`, [projectId, tokenId, chatId, status]);
  return result.rows[0];
}

/**
 * Дополняет существующий ответ списка UI, сохраняя его формат.
 * @param projectId - Проект
 * @param tokenId - Выбранный бот; в общей области используется бот каждой записи
 * @param entries - Записи списка
 * @returns Записи с сохранёнными состояниями
 */
export async function enrichDialogAccess<T extends { userId: string; tokenId?: number | null; isGroup?: boolean }>(
  projectId: number, tokenId: number | null, entries: T[],
) {
  const ids = entries.map((entry) => String(entry.userId));
  /** Статусы одинакового чата у разных ботов не должны подменять друг друга. */
  const tokenIds = [...new Set(entries.map(entry => tokenId ?? entry.tokenId)
    .filter((id): id is number => Number.isSafeInteger(id) && Number(id) > 0))];
  const rows = tokenIds.length && ids.length ? (await dbPool.query(
    `SELECT token_id, chat_id, status, checked_at FROM chat_access
     WHERE project_id = $1 AND token_id = ANY($2::integer[]) AND chat_id = ANY($3::text[])`, [projectId, tokenIds, ids],
  )).rows : [];
  const statuses = new Map(rows.map((row) => [`${row.token_id}:${row.chat_id}`, row]));
  return entries.map((entry) => {
    const access = statuses.get(`${tokenId ?? entry.tokenId}:${entry.userId}`);
    return { ...entry, accessStatus: access?.status ?? 'unknown', accessCheckedAt: access?.checked_at ?? null };
  });
}
