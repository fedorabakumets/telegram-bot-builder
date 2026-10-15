/**
 * @fileoverview Список удалённых и заблокировавших для агента через API панели.
 * @module lib/bot-tools/unavailable-users-db
 */
import { readUsersAnalytics, validUsersCount } from './users-analytics-read.ts';

/** Параметры списка одного бота. */
export interface UnavailableUsersOptions {
  /** Запись бота. Обязательна, чтобы не смешивать ботов. */
  tokenId?: number;
  /** deleted, blocked или both. */
  kind?: 'deleted' | 'blocked' | 'both';
  /** Размер страницы, 1–50. */
  limit?: number;
  /** Смещение. */
  offset?: number;
  /** Адрес панели для проверок. */
  apiBaseUrl?: string;
}

/** Человек в ответе агента. */
interface UnavailableAgentUser {
  /** Telegram id. */
  user_id: string;
  /** Username или null. */
  username: string | null;
  /** Имя или null. */
  first_name: string | null;
  /** Фамилия или null. */
  last_name: string | null;
  /** Аккаунт удалён. */
  is_deleted: boolean;
  /** Заблокировал бота. */
  is_blocked: boolean;
  /** Ссылка, как если открыть профиль по id. */
  telegram_link: string;
  /** Публичная ссылка или null, если username нет. */
  profile_link: string | null;
}

/**
 * Проверяет идентификаторы и страницу до запроса.
 * @param projectId - Проект
 * @param options - Бот и страница
 * @returns Можно ли звать панель
 */
function validOptions(projectId: number, options: UnavailableUsersOptions): boolean {
  const kind = options.kind ?? 'both';
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  return Number.isSafeInteger(projectId) && projectId > 0 &&
    Number.isSafeInteger(options.tokenId) && (options.tokenId ?? 0) > 0 &&
    ['deleted', 'blocked', 'both'].includes(kind) &&
    Number.isInteger(limit) && limit >= 1 && limit <= 50 &&
    Number.isInteger(offset) && offset >= 0 && offset <= 100_000;
}

/**
 * Прячет тело ответа и текст сети.
 * @param error - Ошибка чтения
 * @returns Сообщение для агента
 */
function listError(error: unknown): { error: string } {
  const message = error instanceof Error ? error.message : '';
  return { error: /^(Не удалось получить аналитику: HTTP \d{3}|Некорректн)/.test(message)
    ? message : 'Не удалось получить список из API приложения' };
}

/**
 * Собирает ссылки только из цифр id и безопасного username.
 * @param row - Строка панели
 * @returns Человек или null, если строка битая
 */
function toAgentUser(row: unknown): UnavailableAgentUser | null {
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;
  const userId = value.userId;
  if (typeof userId !== 'string' || !/^[1-9]\d{0,19}$/.test(userId)) return null;
  if (typeof value.isDeleted !== 'boolean' || typeof value.isBlocked !== 'boolean') return null;
  const username = typeof value.userName === 'string' && /^[A-Za-z0-9_]{5,32}$/.test(value.userName) ? value.userName : null;
  const name = (field: unknown) => typeof field === 'string' && field.length > 0 && field.length <= 128 ? field : null;
  return {
    user_id: userId, username, first_name: name(value.firstName), last_name: name(value.lastName),
    is_deleted: value.isDeleted, is_blocked: value.isBlocked,
    telegram_link: `tg://user?id=${userId}`,
    profile_link: username ? `https://t.me/${username}` : null,
  };
}

/**
 * Читает страницу удалённых и заблокировавших выбранного бота.
 * @param projectId - Проект
 * @param options - Бот, вид и страница
 * @returns Список со ссылками либо безопасная ошибка
 */
export async function listUnavailableUsersInDb(projectId: number, options: UnavailableUsersOptions = {}) {
  if (!validOptions(projectId, options)) return { error: 'Некорректные параметры списка' };
  try {
    const query = new URLSearchParams({ tokenId: String(options.tokenId), kind: options.kind ?? 'both' });
    query.set('limit', String(options.limit ?? 20));
    query.set('offset', String(options.offset ?? 0));
    const raw = await readUsersAnalytics(`/api/projects/${projectId}/users/unavailable?${query}`, options);
    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { users?: unknown }).users)) {
      throw new Error('Некорректный ответ API аналитики');
    }
    const body = raw as { users: unknown[]; total: unknown; hasMore: unknown; limit: unknown; offset: unknown };
    if (!validUsersCount(body.total) || typeof body.hasMore !== 'boolean' || !validUsersCount(body.limit) || !validUsersCount(body.offset)) {
      throw new Error('Некорректный ответ API аналитики');
    }
    const users = body.users.map(toAgentUser);
    if (users.some(user => user === null) || users.length > body.limit) throw new Error('Некорректный ответ API аналитики');
    return {
      ok: true as const, project_id: projectId, token_id: options.tokenId, kind: options.kind ?? 'both',
      users, total: body.total, has_more: body.hasMore, limit: body.limit, offset: body.offset,
      next_offset: body.hasMore ? body.offset + users.length : null,
    };
  } catch (error) { return listError(error); }
}
