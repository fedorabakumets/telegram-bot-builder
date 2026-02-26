/**
 * @fileoverview Утилита форматирования даты
 * Использует русскую локализацию date-fns
 * Форматирует дату по московскому времени (UTC+3)
 */

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в читаемую строку по московскому времени
 * @param date - Дата для форматирования
 * @returns Отформатированная строка или пустая строка
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Конвертируем в московское время (UTC+3)
    const moscowTime = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    return format(moscowTime, 'PPp', { locale: ru });
  } catch {
    return '';
  }
}
