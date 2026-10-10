/**
 * @fileoverview Замена логов последнего запуска с сохранением новых событий живого потока.
 */

/** Минимальные поля строки для синхронизации снимка. */
interface SnapshotLine {
  /** Уникальный идентификатор строки */
  id: string;
  /** Время события */
  timestamp: Date;
}

/**
 * Удаляет прошлый кеш и сохраняет события, поступившие после начала запроса.
 * @param current - Текущий кеш строк
 * @param snapshot - Авторитетная выборка последнего запуска
 * @param requestedAt - Время начала запроса выборки
 * @returns Строки актуального запуска без дублей
 */
export function replaceCurrentLaunchSnapshot<T extends SnapshotLine>(
  current: T[], snapshot: T[], requestedAt: number,
): T[] {
  const byId = new Map<string, T>();
  for (const line of current) {
    if (line.timestamp.getTime() >= requestedAt) byId.set(line.id, line);
  }
  for (const line of snapshot) byId.set(line.id, line);
  return Array.from(byId.values())
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).slice(-1000);
}
