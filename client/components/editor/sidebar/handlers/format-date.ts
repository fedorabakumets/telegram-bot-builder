/**
 * @fileoverview Утилита форматирования даты
 * Преобразует дату в локальный формат ru-RU
 */

/**
 * Форматирует дату в читаемый формат
 * @param dateString - Строка даты или объект Date или null
 * @returns Отформатированная дата в формате DD.MM.YYYY HH:mm
 */
export const formatDate = (dateString: string | Date | null): string => {
  if (!dateString) return 'Неизвестно';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
