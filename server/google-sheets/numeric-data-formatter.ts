/**
 * @fileoverview Модуль для форматирования числовых данных в Google Таблицах
 */

import { sheets_v4 } from 'googleapis';

/**
 * Форматирование числовых данных в таблице
 *
 * @function formatNumericData
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {number} rowCount - Количество строк с данными
 * @returns {Promise<void>}
 */
export async function formatNumericData(sheets: sheets_v4.Sheets, spreadsheetId: string, rowCount: number): Promise<void> {
  try {
    const requests = [];

    // В динамической структуре:
    // 0: ID
    // 1: Telegram ID
    // 2: Имя
    // 3: Фамилия
    // 4: Username
    // 5: Язык
    // 6: Премиум
    // 7: Последняя активность
    // 8: Кол-во взаимодействий
    // 9: Дата создания
    // 10: URL фото
    // 11: URL медиа
    // 12+: Переменные (динамические столбцы)
    
    // Установка формата для столбцов дат
    for (let colIndex of [7, 9]) { // lastInteraction и createdAt
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 1, // Начиная со второй строки
            endRowIndex: rowCount + 1,
            startColumnIndex: colIndex,
            endColumnIndex: colIndex + 1
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'DATE',
                pattern: 'dd.mm.yyyy hh:mm'
              }
            }
          },
          fields: 'userEnteredFormat.numberFormat'
        }
      });
    }

    // Установка формата для числовых столбцов
    for (let colIndex of [8]) { // interactionCount
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 1, // Начиная со второй строки
            endRowIndex: rowCount + 1,
            startColumnIndex: colIndex,
            endColumnIndex: colIndex + 1
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'NUMBER',
                pattern: '#,##0'
              }
            }
          },
          fields: 'userEnteredFormat.numberFormat'
        }
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests
      }
    });

    console.log('Форматирование числовых данных завершено');
  } catch (error) {
    console.error('Ошибка форматирования числовых данных:', error);
    throw new Error(`Failed to format numeric data: ${(error as Error).message}`);
  }
}