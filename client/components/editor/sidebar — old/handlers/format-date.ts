/**
 * @fileoverview Утилита форматирования даты
 * Преобразует дату в локальный формат ru-RU
 */

/**
 * Форматирует дату в читаемый формат
 * @param dateString - Строка даты или объект Date или null или timestamp
 * @returns Отформатированная дата в формате DD.MM.YYYY HH:mm или "Неизвестно"
 */
export const formatDate = (dateString: string | Date | number | null): string => {
  if (!dateString) return 'Неизвестно';
  
  let date: Date;
  if (typeof dateString === 'number') {
    // Timestamp
    date = new Date(dateString);
  } else if (typeof dateString === 'string') {
    date = new Date(dateString);
  } else {
    date = dateString;
  }
  
  // Проверяем валидность даты
  if (isNaN(date.getTime())) {
    return 'Неизвестно';
  }
  
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
