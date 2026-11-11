/** @fileoverview Строгая проверка параметров маршрутов пользователей бота. */
/** Параметры страницы пользователей. */
export interface BotUsersPagination {
  /** Размер страницы. */
  limit: number;
  /** Смещение страницы. */
  offset: number;
}
/**
 * Проверяет десятичное целое без неявного преобразования массивов.
 * @param raw - Сырое значение.
 * @param min - Нижняя граница.
 * @param max - Верхняя граница.
 * @returns Число либо отсутствие корректного значения.
 */
function integer(raw: unknown, min: number, max: number): number | null {
  if (typeof raw !== "string" || !/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
}
/**
 * Проверяет идентификатор токена.
 * @param raw - Значение маршрута.
 * @returns Идентификатор либо признак ошибки.
 */
export function parseBotTokenId(raw: unknown): number | null {
  return integer(typeof raw === "string" ? raw.replace(/^token_/, "") : raw, 1, 2147483647);
}
/**
 * Проверяет идентификатор Telegram, сохраняя поддержку отрицательных идентификаторов чатов.
 * @param raw - Значение маршрута.
 * @returns Каноническая строка либо признак ошибки.
 */
export function parseBotUserId(raw: unknown): string | null {
  const value = integer(typeof raw === "string" ? raw.replace(/^user_/, "") : raw, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  return value === null || value === 0 ? null : String(value);
}
/**
 * Проверяет ограниченную пагинацию.
 * @param query - Параметры запроса.
 * @returns Размер и смещение либо признак ошибки.
 */
export function parseBotUsersPagination(query: Record<string, unknown>): BotUsersPagination | null {
  const limit = integer(query.limit === undefined ? "10" : query.limit, 1, 50);
  const offset = integer(query.offset === undefined ? "0" : query.offset, 0, 100000);
  return limit === null || offset === null ? null : { limit, offset };
}
