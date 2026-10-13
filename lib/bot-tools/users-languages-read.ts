/** @fileoverview Проверка распределения сохранённой аудитории по известным языкам. */

/** Настройки снимка языков. */
export interface UsersLanguagesOptions {
  /** Бот; отсутствие означает всех ботов проекта. */
  tokenId?: number;
  /** Адрес API приложения. */
  apiBaseUrl?: string;
}

/** Проверенная строка языкового распределения. */
export interface UsersLanguage {
  /** Код языка из сохранённого профиля Telegram. */
  code: string;
  /** Количество записей аудитории с этим языком. */
  count: number;
  /** Доля среди всех записей с известным языком. */
  percentage: number;
}

/**
 * Нормализует числа PostgreSQL без пробелов, экспонент и нечисловых преобразований.
 * @param value - Число или ограниченная десятичная строка SQL.
 * @param integer - Требуется ли целое значение.
 * @returns Проверенное число.
 */
function parseNumber(value: unknown, integer: boolean): number {
  if (typeof value === 'string' && (value.length > 32 || !/^\d+(?:\.\d+)?$/.test(value))) {
    throw new Error('Некорректный ответ API аналитики');
  }
  if (typeof value !== 'number' && typeof value !== 'string') throw new Error('Некорректный ответ API аналитики');
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (integer ? !Number.isSafeInteger(number) : number > 100)) {
    throw new Error('Некорректный ответ API аналитики');
  }
  return number;
}

/**
 * Проверяет не более двадцати языков, сохраняя проценты исходной полной выборки.
 * @param raw - Ответ API трафика.
 * @returns Нормализованные языки без посторонних полей.
 */
export function parseUsersLanguages(raw: unknown): UsersLanguage[] {
  if (!raw || typeof raw !== 'object' || !('languages' in raw) || !Array.isArray(raw.languages) || raw.languages.length > 20) {
    throw new Error('Некорректный ответ API аналитики');
  }
  const codes = new Set<string>();
  return raw.languages.map(row => {
    if (!row || typeof row !== 'object' || typeof row.code !== 'string' || row.code.length > 64 || codes.has(row.code)) {
      throw new Error('Некорректный ответ API аналитики');
    }
    codes.add(row.code);
    return { code: row.code, count: parseNumber(row.count, true), percentage: parseNumber(row.percentage, false) };
  });
}
