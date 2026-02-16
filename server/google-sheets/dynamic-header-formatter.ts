/**
 * @fileoverview Модуль для форматирования динамических заголовков Google Таблиц
 * Извлекает все уникальные переменные из пользовательских данных и использует их как заголовки столбцов
 */

import { sheets_v4 } from 'googleapis';
import { UserDataForExport } from './data-writer';

/**
 * Извлечение уникальных переменных из всех пользовательских данных
 * 
 * @function extractUniqueVariables
 * @param {UserDataForExport[]} data - Массив данных пользователей для экспорта
 * @returns {string[]} Массив уникальных переменных
 */
export function extractUniqueVariables(data: UserDataForExport[]): string[] {
  const uniqueVariables = new Set<string>();

  for (const user of data) {
    // Парсим userData из JSON строки
    let parsedUserData: any = {};
    try {
      if (user.userData && typeof user.userData === 'string') {
        parsedUserData = JSON.parse(user.userData);
      } else if (typeof user.userData === 'object' && user.userData !== null) {
        parsedUserData = user.userData;
      }
    } catch (e) {
      console.error(`Ошибка парсинга userData для пользователя ${user.id}:`, e);
    }

    // Извлекаем имена переменных из объекта userData
    if (parsedUserData && typeof parsedUserData === 'object') {
      for (const variableName of Object.keys(parsedUserData)) {
        uniqueVariables.add(variableName);
      }
    }
  }

  return Array.from(uniqueVariables);
}

/**
 * Создание динамических заголовков таблицы на основе уникальных переменных
 * 
 * @function createDynamicHeaders
 * @param {string[]} variables - Массив уникальных переменных
 * @returns {string[]} Массив заголовков для Google Таблицы
 */
export function createDynamicHeaders(variables: string[]): string[] {
  // Базовые заголовки, которые всегда присутствуют
  const baseHeaders = [
    'ID',
    'Telegram\nID',
    'Имя',
    'Фамилия',
    'Username',
    'Язык',
    'Премиум',
    'Последняя\nактивность',
    'Кол-во\nвзаимодействий',
    'Дата\nсоздания',
    'URL фото',
    'URL медиа'
  ];

  // Добавляем переменные как заголовки
  const dynamicHeaders = [...baseHeaders, ...variables];

  return dynamicHeaders;
}

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
 * Запись динамических заголовков столбцов в Google Таблицу
 *
 * @function writeDynamicHeaders
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы, в которую записываются заголовки
 * @param {string[]} headers - Массив заголовков
 * @returns {Promise<void>}
 */
export async function writeDynamicHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string, headers: string[]): Promise<void> {
  try {
    // Определяем диапазон для заголовков (A1 до нужной буквы)
    const columnCount = headers.length;
    if (columnCount === 0) {
      throw new Error('Нет заголовков для записи');
    }
    
    const endColumn = columnIndexToColumnLetter(columnCount - 1); // Преобразуем индекс последнего столбца в букву
    const range = `A1:${endColumn}1`;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    console.log(`Динамические заголовки успешно записаны (${headers.length} столбцов)`);
  } catch (error) {
    console.error('Ошибка записи динамических заголовков:', error);
    throw new Error(`Failed to write dynamic headers: ${(error as Error).message}`);
  }
}