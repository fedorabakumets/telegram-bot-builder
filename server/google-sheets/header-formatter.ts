/**
 * @fileoverview Модуль для форматирования заголовков Google Таблиц
 */

import { sheets_v4 } from 'googleapis';

/**
 * Форматирование заголовков таблицы
 *
 * @function formatHeaders
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @returns {Promise<void>}
 */
export async function formatHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          // Форматирование заголовков (первая строка)
          {
            repeatCell: {
              range: {
                sheetId: 0, // Первый лист
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.4,
                    blue: 0.6,
                    alpha: 1
                  },
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    bold: true,
                    fontSize: 12,
                    fontFamily: 'Arial'
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          // Установка высоты строки для заголовков
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 1
              },
              properties: {
                pixelSize: 50
              },
              fields: 'pixelSize'
            }
          }
        ]
      }
    });

    console.log('Форматирование заголовков завершено');
  } catch (error) {
    console.error('Ошибка форматирования заголовков:', error);
    throw new Error(`Failed to format headers: ${(error as Error).message}`);
  }
}