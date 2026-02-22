/**
 * @fileoverview Утилиты для импорта ID из текста
 * Парсинг и валидация Telegram ID из текстового ввода
 */

/**
 * Результат парсинга текста
 */
export interface ParseTextResult {
  /** Список валидных ID */
  validIds: string[];
  /** Список ошибок (невалидные строки) */
  errors: string[];
}

/**
 * Парсит текст и извлекает Telegram ID
 * @param text - Текст со списком ID (по одному в строке)
 * @returns Результат парсинга
 */
export function parseTextIds(text: string): ParseTextResult {
  const lines = text.split(/\r?\n/);
  const validIds: string[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return; // Пропуск пустых строк

    // Валидация: только цифры, длина 5-15 знаков
    if (/^\d{5,15}$/.test(trimmed)) {
      validIds.push(trimmed);
    } else {
      errors.push(`Строка ${index + 1}: "${trimmed}"`);
    }
  });

  return { validIds, errors };
}
