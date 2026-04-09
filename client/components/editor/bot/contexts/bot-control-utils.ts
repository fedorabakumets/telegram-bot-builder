/**
 * @fileoverview Утилиты для компонента bot-control
 *
 * Содержит вспомогательные функции для работы с ботами.
 *
 * @module bot-control-utils
 */

/**
 * Форматирование времени выполнения
 * @param seconds - Количество секунд
 * @returns Отформатированная строка времени
 */
export function formatExecutionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);
  if (secs > 0 && hours === 0) parts.push(`${secs}с`);

  return parts.length > 0 ? parts.join(' ') : '0с';
}

/**
 * Формирует отображаемое имя бота для вкладки терминала.
 * Приоритет: botFirstName (@botUsername) > botFirstName > name > fallback
 * @param token - Данные токена
 * @param fallback - Запасное значение
 * @returns Отображаемое имя бота
 */
export function getBotDisplayName(
  token: { name?: string | null; botFirstName?: string | null; botUsername?: string | null },
  fallback = 'Бот',
): string {
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botFirstName) return token.botFirstName;
  if (token.name) return token.name;
  return fallback;
}
