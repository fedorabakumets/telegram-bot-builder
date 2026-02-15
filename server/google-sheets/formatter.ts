/**
 * @fileoverview Модуль для форматирования Google Таблиц
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
                pixelSize: 30
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

/**
 * Форматирование данных в таблице
 *
 * @function formatData
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {number} rowCount - Количество строк с данными
 * @returns {Promise<void>}
 */
export async function formatData(sheets: sheets_v4.Sheets, spreadsheetId: string, rowCount: number): Promise<void> {
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

    // Установка формата для столбца дат
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

    // Чередование цветов строк
    for (let rowIndex = 1; rowIndex < rowCount + 1; rowIndex += 2) { // Начиная со второй строки (индекс 1)
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 13
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

    // Автоматическая настройка ширины столбцов по содержимому
    for (let i = 0; i < 13; i++) {
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

    console.log('Форматирование данных завершено');
  } catch (error) {
    console.error('Ошибка форматирования данных:', error);
    throw new Error(`Failed to format data: ${(error as Error).message}`);
  }
}

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