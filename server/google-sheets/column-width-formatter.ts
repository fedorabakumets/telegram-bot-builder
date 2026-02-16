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
  // Увеличиваем коэффициент до 12 для лучшего вместимости с учетом размера шрифта
  let width = cleanHeader.length * 12; // примерно 12 пикселей на символ для лучшего вместимости
  
  // Минимальная ширина
  width = Math.max(width, 100);
  
  // Максимальная ширина
  width = Math.min(width, 600);
  
  // Если есть переносы строк, увеличиваем ширину, учитывая самую длинную строку
  if (header.includes('\n')) {
    const lines = header.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    // Умножаем на 16 для лучшего вместимости многострочных заголовков с учетом размера шрифта
    const calculatedWidth = maxLineLength * 16;
    width = Math.max(width, calculatedWidth);
    
    // Добавляем дополнительный отступ для многострочных заголовков
    width += 30;
  }
  
  // Для некоторых специфических заголовков устанавливаем фиксированную ширину
  switch(cleanHeader) {
    case 'ID':
      return 120; // Увеличил с 100
    case 'Telegram ID':
      return 160; // Увеличил с 140
    case 'Username':
      return 180; // Увеличил с 160
    case 'Последняя активность':
      return 200; // Увеличил с 180
    case 'Кол-во взаимодействий':
      return 220; // Увеличил с 200
    case 'Дата создания':
      return 180; // Увеличил с 160
    case 'Премиум':
      return 140; // Увеличил с 120
    case 'URL фото':
      return 220; // Увеличил с 200
    case 'URL медиа':
      return 220; // Увеличил с 200
    default:
      // Для переменных используем ширину, основанную на длине названия
      // Но ограничиваем максимальную ширину
      return Math.min(width, 300);
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