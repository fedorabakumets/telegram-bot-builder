/**
 * @fileoverview Модуль для форматирования ширины столбцов в Google Таблицах
 */

import { sheets_v4 } from 'googleapis';

/**
 * Преобразует индекс столбца в буквенный формат Google Таблиц (A, B, ..., Z, AA, AB, ...)
 * 
 * @function columnIndexToColumnLetter
 * @param {number} index - Индекс столбца (начиная с 0)
 * @returns {string} Буквенное обозначение столбца
 */
function columnIndexToColumnLetter(index: number): string {
  let result = '';
  index++; // Преобразуем к 1-индексации
  
  while (index > 0) {
    index--; // Уменьшаем на 1, чтобы работать с 0-25
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26);
  }
  
  return result;
}

/**
 * Рассчитывает ширину столбца на основе заголовка
 * @param header Заголовок столбца
 * @returns Ширину столбца в пикселях
 */
function getColumnWidthByHeader(header: string): number {
  // Убираем переносы строк для расчета базовой ширины
  const cleanHeader = header.replace(/\n/g, ' ');
  
  // Базовая ширина зависит от длины заголовка
  // Увеличиваем коэффициент с 8 до 10 для лучшего вместимости
  let width = cleanHeader.length * 10; // примерно 10 пикселей на символ для лучшего вместимости
  
  // Минимальная ширина
  width = Math.max(width, 80);
  
  // Максимальная ширина
  width = Math.min(width, 500);
  
  // Если есть переносы строк, увеличиваем ширину, учитывая самую длинную строку
  if (header.includes('\n')) {
    const lines = header.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    // Умножаем на 12 для лучшего вместимости многострочных заголовков
    const calculatedWidth = maxLineLength * 14; // Увеличил с 12 до 14 для лучшего вместимости
    width = Math.max(width, calculatedWidth);
    
    // Добавляем дополнительный отступ для многострочных заголовков
    width += 20;
  }
  
  // Для некоторых специфических заголовков устанавливаем фиксированную ширину
  switch(cleanHeader) {
    case 'ID':
      return 100; // Увеличил с 80
    case 'Telegram ID':
      return 140; // Увеличил с 120
    case 'Username':
      return 160; // Увеличил с 140
    case 'Последняя активность':
      return 180; // Увеличил с 160
    case 'Кол-во взаимодействий':
      return 200; // Увеличил с 180
    case 'Дата создания':
      return 160; // Увеличил с 140
    case 'Премиум':
      return 120; // Увеличил с 80
    case 'URL фото':
      return 200; // Увеличил с 180
    case 'URL медиа':
      return 200; // Увеличил с 180
    default:
      // Для переменных используем ширину, основанную на длине названия
      // Но ограничиваем максимальную ширину
      return Math.min(width, 250);
  }
}

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

    // Для каждого столбца вычисляем ширину на основе заголовка
    for (let i = 0; i < headers.length; i++) {
      const width = getColumnWidthByHeader(headers[i]);
      
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: i,
            endIndex: i + 1
          },
          properties: {
            pixelSize: width
          },
          fields: 'pixelSize'
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