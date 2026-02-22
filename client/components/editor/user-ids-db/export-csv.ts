/**
 * @fileoverview Утилиты для экспорта ID пользователей
 * Генерация и скачивание CSV файлов
 */

/**
 * Генерирует CSV содержимое из массива ID
 * @param ids - Массив Telegram ID
 * @returns CSV строка (один ID в строке)
 */
export function generateCSV(ids: string[]): string {
  return ids.join('\n');
}

/**
 * Скачивает CSV файл с ID
 * @param ids - Массив ID для экспорта
 * @param filename - Имя файла (по умолчанию 'user-ids.csv')
 */
export function downloadCSV(ids: string[], filename: string = 'user-ids.csv'): void {
  const csv = generateCSV(ids);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Копирует список ID в буфер обмена
 * @param ids - Массив ID для копирования
 * @returns Промис с результатом копирования
 */
export async function copyToClipboard(ids: string[]): Promise<boolean> {
  const text = generateCSV(ids);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
