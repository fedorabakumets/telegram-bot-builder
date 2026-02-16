/**
 * @fileoverview Модуль для форматирования структуры Google Таблиц
 */

import { sheets_v4 } from 'googleapis';

/**
 * Закрепление строки заголовков
 *
 * @function freezeHeaders
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @returns {Promise<void>}
 */
export async function freezeHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          updateSheetProperties: {
            properties: {
              sheetId: 0,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        }]
      }
    });

    console.log('Заголовки закреплены');
  } catch (error) {
    console.error('Ошибка закрепления заголовков:', error);
    throw new Error(`Failed to freeze headers: ${(error as Error).message}`);
  }
}

/**
 * Добавление фильтров к таблице
 *
 * @function addFilters
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {number} columnCount - Количество столбцов
 * @returns {Promise<void>}
 */
export async function addFilters(sheets: sheets_v4.Sheets, spreadsheetId: string, columnCount: number = 100): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          setBasicFilter: {
            filter: {
              range: {
                sheetId: 0,
                startRowIndex: 0, // Начиная с заголовков
                startColumnIndex: 0,
                endColumnIndex: columnCount // Используем переданное количество столбцов
                // endRowIndex не указан, чтобы охватить все строки
              }
            }
          }
        }]
      }
    });

    console.log('Фильтры добавлены');
  } catch (error) {
    console.error('Ошибка добавления фильтров:', error);
    throw new Error(`Failed to add filters: ${(error as Error).message}`);
  }
}