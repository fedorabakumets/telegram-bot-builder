/**
 * @fileoverview Общие типы ответа активности пользователей
 * @module server/routes/users/user-activity-types
 */

/** Точка графика: активные, новички и вернувшиеся в слоте */
export interface UserActivityPoint {
  /** ISO-дата слота */
  date: string;
  /** Уникальные активные в слоте */
  total: number;
  /** Новички слота (first_seen_at попадает в слот) */
  newcomers: number;
  /** Вернувшиеся = total − newcomers */
  returning: number;
}

/** Полный ответ GET /users/activity */
export interface UserActivityResponse {
  /** Точки по слотам (пустые заполнены нулями) */
  points: UserActivityPoint[];
  /** Уникальные активные за всё окно */
  activeInWindow: number;
  /** Новички за всё окно */
  newInWindow: number;
}

/**
 * Собирает точку из строк SQL (total/newcomers)
 * @param date - Дата слота
 * @param total - Все активные
 * @param newcomers - Новички
 * @returns Точка с returning
 */
export function toUserActivityPoint(
  date: string,
  total: number,
  newcomers: number,
): UserActivityPoint {
  const t = Number(total) || 0;
  const n = Number(newcomers) || 0;
  return { date, total: t, newcomers: n, returning: Math.max(0, t - n) };
}
