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
 * @param tokenId - Выбранный бот; без него статус неизвестен
 * @param entries - Записи списка
 * @returns Записи с сохранёнными состояниями
 */
export async function enrichDialogAccess<T extends { userId: string; isGroup?: boolean }>(
  projectId: number, tokenId: number | null, entries: T[],
) {
  const ids = entries.map((entry) => String(entry.userId));
  const rows = tokenId && ids.length ? (await dbPool.query(
    `SELECT chat_id, status, checked_at FROM chat_access
     WHERE project_id = $1 AND token_id = $2 AND chat_id = ANY($3::text[])`, [projectId, tokenId, ids],
  )).rows : [];
  const statuses = new Map(rows.map((row) => [row.chat_id, row]));
  return entries.map((entry) => {
    const access = statuses.get(String(entry.userId));
    return { ...entry, accessStatus: access?.status ?? 'unknown', accessCheckedAt: access?.checked_at ?? null };
  });
}
