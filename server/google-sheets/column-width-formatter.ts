/**
 * @fileoverview Модуль для форматирования ширины столбцов в Google Таблицах
 */

import { sheets_v4 } from 'googleapis';



/**
 * Форматирование ширины столбцов
 *
 * @function formatColumnWidths
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {string[]} headers - Массив заголовков столбцов
 * @returns {Promise<void>}
 */
export async function formatColumnWidths(sheets: sheets_v4.Sheets, spreadsheetId: string, headers: string[] = []): Promise<void> {
  try {
    const requests = [];

    // Автоматическая настройка ширины столбцов по содержимому (аналог двойного клика на границе столбца)
    // Убедимся, что не пытаемся изменить размер несуществующих столбцов
    const columnCount = headers.length;
    const actualColumnCount = Math.min(columnCount, 100); // Ограничиваем максимальное количество столбцов
    for (let i = 0; i < actualColumnCount; i++) {
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: i,
            endIndex: i + 1
          }
        }
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests
      }
    });

    console.log(`Форматирование ширины столбцов завершено (${headers.length} столбцов)`);
  } catch (error) {
    console.error('Ошибка форматирования ширины столбцов:', error);
    throw new Error(`Failed to format column widths: ${(error as Error).message}`);
  }
}