/**
 * @fileoverview Чистая логика выбора launch для getLatestLaunchLogs
 * @module server/bots/selectLatestLaunchLogs
 */

/** Краткая запись истории запуска */
export interface LaunchHistoryRef {
  /** ID записи bot_launch_history */
  id: number;
  /** Статус запуска */
  status: string;
}

/**
 * Решает, какие launch_id включать в выборку логов.
 * Берём последний launch из history; для running дополнительно включаем NULL (live).
 * @param lastLaunch - Последняя запись history или null
 * @returns Список launchId (включая null как «без launch»)
 */
export function resolveLaunchIdsForLogs(
  lastLaunch: LaunchHistoryRef | null,
): Array<number | null> {
  if (!lastLaunch) {
    return [null];
  }
  if (lastLaunch.status === 'running') {
    return [lastLaunch.id, null];
  }
  return [lastLaunch.id];
}

/**
 * Сливает два списка логов по timestamp ASC и обрезает до limit с конца
 * @param a - Первый набор
 * @param b - Второй набор
 * @param limit - Максимум строк
 * @returns Отсортированный по времени набор (старые → новые)
 */
export function mergeLogsByTimestampAsc<T extends { timestamp: Date | string | null }>(
  a: T[],
  b: T[],
  limit: number,
): T[] {
  const merged = [...a, ...b].sort((x, y) => {
    const tx = x.timestamp ? new Date(x.timestamp).getTime() : 0;
    const ty = y.timestamp ? new Date(y.timestamp).getTime() : 0;
    return tx - ty;
  });
  if (merged.length <= limit) return merged;
  return merged.slice(merged.length - limit);
}
