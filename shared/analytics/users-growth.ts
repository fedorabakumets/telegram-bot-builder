/**
 * @fileoverview Общие расчёты прироста пользователей для интерфейса и инструментов аналитики.
 */

/** Точка прироста пользователей за один временной интервал. */
export interface UsersGrowthPoint {
  /** Дата начала интервала в формате ISO. */
  date: string;
  /** Число новых записей пользователей за интервал. */
  count: number;
}

/** Сводка числа записей пользователей и прироста за выбранный период. */
export interface UsersGrowthSummary {
  /** Текущее общее число записей пользователей выбранных ботов. */
  totalUsers: number;
  /** Суммарное число новых записей пользователей за период. */
  newUsers: number;
  /** Число записей пользователей до периода, восстановленное по текущему итогу. */
  initialUsers: number;
}

/**
 * Рассчитывает сводку по приросту; один человек у разных ботов учитывается отдельно.
 * @param points - Точки прироста за весь выбранный период.
 * @param total - Текущее общее число записей пользователей.
 * @returns Общее число, прирост за период и число до начала периода.
 */
export function getUsersGrowthSummary(points: UsersGrowthPoint[], total: number): UsersGrowthSummary {
  const newUsers = points.reduce((sum, point) => sum + point.count, 0);
  return { totalUsers: total, newUsers, initialUsers: Math.max(0, total - newUsers) };
}

/**
 * Сортирует точки и рассчитывает накопление без изменения исходного массива.
 * @param points - Точки прироста за весь выбранный период.
 * @param total - Текущее общее число; при отсутствии накопление начинается с нуля.
 * @returns Точки с нарастающим итогом, включая аудиторию до начала периода.
 */
export function calculateCumulativeGrowth(points: UsersGrowthPoint[], total?: number): UsersGrowthPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  let sum = total === undefined ? 0 : getUsersGrowthSummary(sorted, total).initialUsers;
  return sorted.map(point => ({ date: point.date, count: (sum += point.count) }));
}
