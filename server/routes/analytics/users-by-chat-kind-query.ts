/**
 * @fileoverview Сколько людей писали в личных чатах, группах и каналах.
 * @module server/routes/analytics/users-by-chat-kind-query
 */
import type { Pool } from 'pg';

/** Четыре счётчика людей по виду чата. */
export interface UsersByChatKindCounts {
  /** Люди с хотя бы одним личным сообщением. */
  privateUsers: number;
  /** Люди с сообщением в группе или супергруппе. */
  groupUsers: number;
  /** Люди с сообщением в канале. */
  channelUsers: number;
  /** Люди, у которых два или три признака сразу. */
  usersInSeveralPlaces: number;
}

/** Нули, если запрос видов чата не выполнился. */
const EMPTY_USERS_BY_CHAT_KIND: UsersByChatKindCounts = {
  privateUsers: 0,
  groupUsers: 0,
  channelUsers: 0,
  usersInSeveralPlaces: 0,
};

/**
 * Приводит значение из PostgreSQL к безопасному целому.
 * @param value - Число или строка драйвера
 * @returns Целое не меньше нуля, иначе 0
 */
function toSafeCount(value: unknown): number {
  const count = Number(value ?? 0);
  if (!Number.isSafeInteger(count) || count < 0) return 0;
  return count;
}

/**
 * Считает людей по виду чата в тех же границах, что stats.
 * Один человек у двух ботов считается дважды. Сбой запроса не пробрасывается.
 * @param pool - Пул PostgreSQL
 * @param projectId - Проект
 * @param tokenId - Бот или null, если считать всех ботов проекта
 * @returns Четыре целых числа
 */
export async function queryUsersByChatKind(
  pool: Pool,
  projectId: number,
  tokenId: number | null,
): Promise<UsersByChatKindCounts> {
  try {
    const result = await pool.query(
      `WITH people AS (
         SELECT u.user_id, u.project_id, u.token_id
         FROM bot_users u
         WHERE u.project_id = $1
           AND ($2::integer IS NULL OR u.token_id = $2)
           AND u.user_id > 0
           AND COALESCE(u.is_bot, 0) = 0
       ),
       flags AS (
         SELECT
           COALESCE(BOOL_OR(
             m.chat_type IS NULL OR m.chat_type = 'private' OR m.chat_id = p.user_id::text
           ), false) AS is_private,
           COALESCE(BOOL_OR(m.chat_type IN ('group', 'supergroup')), false) AS is_group,
           COALESCE(BOOL_OR(m.chat_type = 'channel'), false) AS is_channel
         FROM people p
         INNER JOIN bot_messages m
           ON m.project_id = p.project_id
          AND m.token_id = p.token_id
          AND m.user_id = p.user_id::text
         GROUP BY p.project_id, p.token_id, p.user_id
       )
       SELECT
         COUNT(*) FILTER (WHERE is_private)::int AS "privateUsers",
         COUNT(*) FILTER (WHERE is_group)::int AS "groupUsers",
         COUNT(*) FILTER (WHERE is_channel)::int AS "channelUsers",
         COUNT(*) FILTER (WHERE (is_private::int + is_group::int + is_channel::int) >= 2)::int
           AS "usersInSeveralPlaces"
       FROM flags`,
      [projectId, tokenId],
    );
    const row = result.rows[0] ?? {};
    return {
      privateUsers: toSafeCount(row.privateUsers),
      groupUsers: toSafeCount(row.groupUsers),
      channelUsers: toSafeCount(row.channelUsers),
      usersInSeveralPlaces: toSafeCount(row.usersInSeveralPlaces),
    };
  } catch (error) {
    console.error('Ошибка подсчёта людей по виду чата:', error);
    return { ...EMPTY_USERS_BY_CHAT_KIND };
  }
}
