/**
 * @fileoverview Выборка людей с удалённым аккаунтом или блокировкой бота.
 * @module server/routes/analytics/unavailable-users-query
 */
import type { Pool } from 'pg';

/** Какой признак выбирать. */
export type UnavailableKind = 'deleted' | 'blocked' | 'both';

/** Человек из bot_users без текста сообщений. */
export interface UnavailableUserRow {
  /** Telegram user id строкой. */
  userId: string;
  /** Username без ссылки или null. */
  userName: string | null;
  /** Имя или null. */
  firstName: string | null;
  /** Фамилия или null. */
  lastName: string | null;
  /** is_deleted = 1. */
  isDeleted: boolean;
  /** is_blocked = 1. */
  isBlocked: boolean;
}

/** Страница списка. */
export interface UnavailableUsersPage {
  /** Люди этой страницы. */
  users: UnavailableUserRow[];
  /** Сколько людей подходит под фильтр. */
  total: number;
  /** Есть ли следующая страница. */
  hasMore: boolean;
  /** Размер страницы. */
  limit: number;
  /** Смещение. */
  offset: number;
}

/**
 * Читает вид списка из query.
 * @param raw - Значение kind
 * @returns Вид или null, если значение чужое
 */
export function parseUnavailableKind(raw: unknown): UnavailableKind | null {
  if (raw === undefined || raw === '' || raw === 'both') return 'both';
  if (raw === 'deleted' || raw === 'blocked') return raw;
  return null;
}

/**
 * Читает страницу: по умолчанию 20, не больше 50.
 * @param limitRaw - limit
 * @param offsetRaw - offset
 * @returns Числа или null
 */
export function parseUnavailablePage(limitRaw: unknown, offsetRaw: unknown): { limit: number; offset: number } | null {
  const limit = limitRaw === undefined || limitRaw === '' ? 20 : Number(limitRaw);
  const offset = offsetRaw === undefined || offsetRaw === '' ? 0 : Number(offsetRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return null;
  if (!Number.isInteger(offset) || offset < 0 || offset > 100_000) return null;
  return { limit, offset };
}

/** Общее условие: люди выбранного бота с нужным флагом. */
const WHERE_SQL = `
  FROM bot_users u
  WHERE u.project_id = $1 AND u.token_id = $2 AND u.user_id > 0 AND COALESCE(u.is_bot, 0) = 0
    AND (
      ($3::text = 'deleted' AND COALESCE(u.is_deleted, 0) = 1)
      OR ($3::text = 'blocked' AND COALESCE(u.is_blocked, 0) = 1)
      OR ($3::text = 'both' AND (COALESCE(u.is_deleted, 0) = 1 OR COALESCE(u.is_blocked, 0) = 1))
    )`;

/**
 * Возвращает страницу удалённых и заблокировавших без обращения к Telegram.
 * @param pool - Пул базы
 * @param projectId - Проект
 * @param tokenId - Бот
 * @param kind - Какой признак
 * @param limit - Размер страницы
 * @param offset - Смещение
 * @returns Страница
 */
export async function queryUnavailableUsers(
  pool: Pool, projectId: number, tokenId: number, kind: UnavailableKind, limit: number, offset: number,
): Promise<UnavailableUsersPage> {
  const params = [projectId, tokenId, kind];
  const [data, count] = await Promise.all([
    pool.query(
      `SELECT u.user_id::text AS "userId", NULLIF(u.username, '') AS "userName",
              NULLIF(u.first_name, '') AS "firstName", NULLIF(u.last_name, '') AS "lastName",
              COALESCE(u.is_deleted, 0) = 1 AS "isDeleted", COALESCE(u.is_blocked, 0) = 1 AS "isBlocked"
       ${WHERE_SQL} ORDER BY u.user_id LIMIT $4 OFFSET $5`,
      [...params, limit, offset],
    ),
    pool.query(`SELECT COUNT(*)::int AS total ${WHERE_SQL}`, params),
  ]);
  const total = Number(count.rows[0]?.total ?? 0);
  const users = data.rows as UnavailableUserRow[];
  return { users, total, hasMore: offset + users.length < total, limit, offset };
}
