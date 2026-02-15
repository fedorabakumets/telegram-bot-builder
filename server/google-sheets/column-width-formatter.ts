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
 * @returns {Promise<void>}
 */
export async function formatColumnWidths(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<void> {
  try {
    const requests = [];

    // Установка ширины для конкретных столбцов в зависимости от содержимого
    // ID
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 1
        },
        properties: {
          pixelSize: 80
        },
        fields: 'pixelSize'
      }
    });

    // Telegram ID
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 1,
          endIndex: 2
        },
        properties: {
          pixelSize: 120
        },
        fields: 'pixelSize'
      }
    });

    // Имя
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 2,
          endIndex: 3
        },
        properties: {
          pixelSize: 100
        },
        fields: 'pixelSize'
      }
    });

    // Фамилия
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 3,
          endIndex: 4
        },
        properties: {
          pixelSize: 100
        },
        fields: 'pixelSize'
      }
    });

    // Username
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 4,
          endIndex: 5
        },
        properties: {
          pixelSize: 120
        },
        fields: 'pixelSize'
      }
    });

    // Язык
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 5,
          endIndex: 6
        },
        properties: {
          pixelSize: 80
        },
        fields: 'pixelSize'
      }
    });

    // Premium
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 6,
          endIndex: 7
        },
        properties: {
          pixelSize: 80
        },
        fields: 'pixelSize'
      }
    });

    // Последняя активность
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 7,
          endIndex: 8
        },
        properties: {
          pixelSize: 150
        },
        fields: 'pixelSize'
      }
    });

    // Количество взаимодействий
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 8,
          endIndex: 9
        },
        properties: {
          pixelSize: 100
        },
        fields: 'pixelSize'
      }
    });

    // Дата создания
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 9,
          endIndex: 10
        },
        properties: {
          pixelSize: 150
        },
        fields: 'pixelSize'
      }
    });

    // Данные пользователя (JSON)
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 10,
          endIndex: 11
        },
        properties: {
          pixelSize: 300
        },
        fields: 'pixelSize'
      }
    });

    // URL фото
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 11,
          endIndex: 12
        },
        properties: {
          pixelSize: 200
        },
        fields: 'pixelSize'
      }
    });

    // URL медиа
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 12,
          endIndex: 13
        },
        properties: {
          pixelSize: 200
        },
        fields: 'pixelSize'
      }
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests
      }
    });

    console.log('Форматирование ширины столбцов завершено');
  } catch (error) {
    console.error('Ошибка форматирования ширины столбцов:', error);
    throw new Error(`Failed to format column widths: ${(error as Error).message}`);
  }
}