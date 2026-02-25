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
