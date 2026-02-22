/**
 * @fileoverview Утилиты для импорта CSV файлов
 * Парсинг и валидация Telegram ID из CSV
 */

/**
 * Результат парсинга CSV
 */
export interface ParseResult {
  /** Список валидных ID */
  validIds: string[];
  /** Список ошибок (невалидные строки) */
  errors: string[];
}

/**
 * Парсит CSV файл и извлекает Telegram ID
 * @param file - CSV файл для парсинга
 * @returns Промис с результатом парсинга
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/);
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

      resolve({ validIds, errors });
    };

    reader.onerror = () => {
      resolve({ validIds: [], errors: ['Ошибка чтения файла'] });
    };

    reader.readAsText(file);
  });
}
