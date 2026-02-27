/**
 * @fileoverview Утилита форматирования относительного времени
 * Форматирует дату в стиле "5 мин назад", "1 час назад", "вчера"
 */

/**
 * Форматирует дату в относительном стиле
 * @param date - Дата для форматирования
 * @returns Строка в формате "5 мин назад", "1 час назад", "вчера", "12.02.2026"
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Только что';
    if (diffMin < 60) return `${diffMin} мин назад`;
    if (diffHour < 24) return `${diffHour} ч назад`;
    if (diffDay === 1) return 'Вчера';
    if (diffDay < 7) return `${diffDay} дн назад`;
    
    return past.toLocaleDateString('ru-RU');
  } catch {
    return '';
  }
}
