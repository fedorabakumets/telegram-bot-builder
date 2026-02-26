/**
 * @fileoverview Утилита форматирования даты
 * @description Форматирует дату в удобочитаемый формат на русском языке
 */

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в удобочитаемый формат
 * @param {unknown} date - Дата для форматирования
 * @returns {string} Отформатированная строка или 'Не указано'
 */
export function formatDate(date: unknown): string {
  if (!date) return 'Не указано';
  try {
    const dateObj = typeof date === 'string' ? new Date(date)
      : date instanceof Date ? date
        : typeof date === 'number' ? new Date(date)
          : 'Не указано';

    if (dateObj === 'Не указано') return 'Не указано';
    return format(dateObj, 'PPp', { locale: ru });
  } catch {
    return 'Не указано';
  }
}
