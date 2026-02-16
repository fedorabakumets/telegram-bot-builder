/**
 * @fileoverview Модуль для форматирования стилей строк в Google Таблицах
 */

import { sheets_v4 } from 'googleapis';

/**
 * Форматирование стилей строк (чередование цветов и т.д.)
 *
 * @function formatRowStyles
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {number} rowCount - Количество строк с данными
 * @param {number} columnCount - Количество столбцов с данными
 * @returns {Promise<void>}
 */
export async function formatRowStyles(sheets: sheets_v4.Sheets, spreadsheetId: string, rowCount: number, columnCount: number = 50): Promise<void> {
  try {
    const requests = [];

    // Чередование цветов строк
    // Используем реальное количество столбцов
    for (let rowIndex = 1; rowIndex < rowCount + 1; rowIndex += 2) { // Начиная со второй строки (индекс 1)
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: columnCount // Используем реальное количество столбцов
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.95,
                green: 0.95,
                blue: 0.95,
                alpha: 1
              }
            }
          },
          fields: 'userEnteredFormat.backgroundColor'
        }
      });
    }

    // Примечание: Автоматическое уравнивание ширины столбцов теперь выполняется в отдельной функции
    // чтобы избежать конфликтов и обеспечить правильную синхронизацию

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests
      }
    });

    console.log('Форматирование стилей строк завершено');
  } catch (error) {
    console.error('Ошибка форматирования стилей строк:', error);
    throw new Error(`Failed to format row styles: ${(error as Error).message}`);
  }
}