/**
 * Форматирует дату для отображения
 * @param date - Дата для форматирования
 * @returns Отформатированная дата или "Никогда"
 */
export function formatDate(date: unknown): string {
  if (!date) return 'Никогда';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) :
      date instanceof Date ? date :
        typeof date === 'number' ? new Date(date) :
          null;

    if (!dateObj) return 'Никогда';

    return dateObj.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Никогда';
  }
}
