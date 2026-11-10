/** @fileoverview Выбор совместимого или отдельного режима HTTP-сервера. */
/** Доступные режимы сервера: полное приложение либо только серверные маршруты. */
export type AppMode = 'combined' | 'backend';

/** Проверяет режим до запуска миграций и фоновых процессов.
 * @param value - Значение APP_MODE из окружения
 * @returns Проверенный режим; отсутствие значения сохраняет прежнее поведение
 */
export function resolveAppMode(value = process.env.APP_MODE): AppMode {
  if (value === undefined || value === '' || value === 'combined') return 'combined';
  if (value === 'backend') return value;
  throw new Error('APP_MODE должен быть combined или backend');
}
