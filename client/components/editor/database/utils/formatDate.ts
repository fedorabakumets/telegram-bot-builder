/**
 * @fileoverview Утилита форматирования даты
 * @description Форматирует дату в удобочитаемый формат на русском языке
 */

/**
 * Форматирует дату в удобочитаемый формат
 * @param date - Дата для форматирования
 * @param options - Опции форматирования
 * @returns Отформатированная строка или 'Не указано'
 */
export function formatDate(
  date: unknown,
  options?: { 
    format?: string;
    timeZone?: string;
    fallback?: string;
  }
): string {
  const {
    timeZone = 'Europe/Moscow',
    fallback = 'Не указано'
  } = options ?? {};

  if (!date) return fallback;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date)
      : date instanceof Date ? date
        : typeof date === 'number' ? new Date(date)
          : null;

    if (!dateObj) return fallback;
    
    // Используем toLocaleString для поддержки timezone
    return dateObj.toLocaleString('ru-RU', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return fallback;
  }
}
