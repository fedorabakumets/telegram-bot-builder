/**
 * @fileoverview Утилита генерации имени следующего листа холста.
 * Возвращает имя вида "Лист N" с автоматической нумерацией,
 * аналогично кнопке "+" добавления листа.
 * @module utils/sheets/generate-next-sheet-name
 */

/**
 * Генерирует имя следующего листа в формате "Лист N".
 * Анализирует существующие листы, находит максимальный номер вида "Лист N"
 * и возвращает следующий по порядку номер. Если подходящих имён нет —
 * используется количество листов + 1.
 * @param sheets - Массив листов, у каждого из которых есть поле name
 * @returns Имя нового листа вида "Лист N"
 */
export function generateNextSheetName(sheets: Array<{ name: string }>): string {
  const existingNumbers = sheets
    .map(sheet => {
      const match = sheet.name.match(/^Лист (\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => num > 0);

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : sheets.length + 1;
  return `Лист ${nextNumber}`;
}
