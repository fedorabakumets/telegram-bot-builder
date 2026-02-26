/**
 * @fileoverview Утилита форматирования даты
 * Использует русскую локализацию date-fns
 */

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в читаемую строку
 * @param date - Дата для форматирования
 * @returns Отформатированная строка или пустая строка
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPp', { locale: ru });
  } catch {
    return '';
  }
}
