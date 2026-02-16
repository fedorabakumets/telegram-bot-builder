/**
 * @fileoverview Модуль для записи данных в Google Таблицы
 */

import { sheets_v4 } from 'googleapis';

/**
 * Интерфейс для данных пользователя, экспортируемых в Google Таблицы
 */
export interface UserDataForExport {
  id: string | number;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  languageCode: string | null;
  isPremium: string | number;
  lastInteraction: string;
  interactionCount: string | number;
  createdAt: string;
  userData: string; // JSON строка
  photoUrls: string;
  mediaUrls: string;
}

import { extractUniqueVariables } from './dynamic-header-formatter';

/**
 * Интерфейс для отдельного ответа пользователя
 */
export interface UserResponse {
  id: string | number;
  userId: string;
  variableName: string;
  responseValue: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  languageCode: string | null;
  isPremium: string | number;
  timestamp: string;
  interactionCount: string | number;
  createdAt: string;
  photoUrls: string;
  mediaUrls: string;
}

/**
 * Создание новой Google Таблицы для экспорта данных
 *
 * @function createSpreadsheet
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} projectName - Название проекта, которое будет использоваться в названии таблицы
 * @param {number} projectId - ID проекта, добавляется к названию таблицы для уникальности
 * @returns {Promise<string>} ID созданной таблицы
 */
export async function createSpreadsheet(sheets: sheets_v4.Sheets, projectName: string, projectId: number): Promise<string> {
  try {
    const spreadsheet = {
      properties: {
        title: `${projectName} - User Data Export (Project ${projectId}) - ${new Date().toISOString().split('T')[0]}`
      }
    };

    const response = await sheets.spreadsheets.create({
      requestBody: spreadsheet,
      fields: 'spreadsheetId'
    });

    console.log(`Создана таблица с ID: ${response.data.spreadsheetId}`);
    return response.data.spreadsheetId as string;
  } catch (error) {
    console.error('Ошибка создания таблицы:', error);
    throw new Error(`Failed to create spreadsheet: ${(error as Error).message}`);
  }
}

/**
 * Запись заголовков столбцов в Google Таблицу (старый метод, для совместимости)
 * Для динамических заголовков используйте writeDynamicHeaders
 *
 * @function writeHeaders
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы, в которую записываются заголовки
 * @returns {Promise<void>}
 */
export async function writeHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<void> {
  try {
    const headers = [
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

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1:L1', // Заголовки в первой строке (12 базовых столбцов)
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    console.log('Заголовки успешно записаны (старый формат)');
  } catch (error) {
    console.error('Ошибка записи заголовков:', error);
    throw new Error(`Failed to write headers: ${(error as Error).message}`);
  }
}

/**
 * Преобразование пользовательских данных в формат, подходящий для Google Таблиц
 * Распаковывает ответы пользователей в отдельные строки
 * 
 * @function transformUserDataForExport
 * @param {UserDataForExport[]} data - Массив данных пользователей для экспорта
 * @returns {UserResponse[]} Массив преобразованных данных
 */
export function transformUserDataForExport(data: UserDataForExport[]): UserResponse[] {
  const transformedData: UserResponse[] = [];

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

    // Если у пользователя есть ответы, добавляем каждую переменную как отдельную строку
    if (parsedUserData && typeof parsedUserData === 'object') {
      for (const [variableName, responseValue] of Object.entries(parsedUserData)) {
        let valueStr = '';
        
        // Обработка различных форматов ответа
        if (typeof responseValue === 'object' && responseValue !== null) {
          // Если это объект с информацией об ответе
          if ('value' in responseValue) {
            valueStr = String((responseValue as any).value);
          } else if ('photoUrl' in responseValue) {
            valueStr = String((responseValue as any).photoUrl);
          } else if ('media' in responseValue) {
            // Если это медиа-ответ, преобразуем в строку URL-ов
            const mediaArray = (responseValue as any).media;
            if (Array.isArray(mediaArray)) {
              valueStr = mediaArray.map((m: any) => m.url || m).join(', ');
            } else {
              valueStr = JSON.stringify(responseValue);
            }
          } else {
            valueStr = JSON.stringify(responseValue);
          }
        } else {
          // Простое строковое значение
          valueStr = String(responseValue);
        }

        transformedData.push({
          id: user.id,
          userId: user.userId,
          variableName: variableName,
          responseValue: valueStr,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          languageCode: user.languageCode,
          isPremium: user.isPremium,
          timestamp: user.lastInteraction,
          interactionCount: user.interactionCount,
          createdAt: user.createdAt,
          photoUrls: user.photoUrls,
          mediaUrls: user.mediaUrls
        });
      }
    } else {
      // Если у пользователя нет ответов, добавляем хотя бы одну строку с базовой информацией
      transformedData.push({
        id: user.id,
        userId: user.userId,
        variableName: 'Нет ответов',
        responseValue: 'Пользователь не дал ответов',
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        languageCode: user.languageCode,
        isPremium: user.isPremium,
        timestamp: user.lastInteraction,
        interactionCount: user.interactionCount,
        createdAt: user.createdAt,
        photoUrls: user.photoUrls,
        mediaUrls: user.mediaUrls
      });
    }
  }

  return transformedData;
}

/**
 * Запись данных пользователей в Google Таблицу
 *
 * @function writeData
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы, в которую записываются данные
 * @param {UserDataForExport[]} data - Массив данных пользователей для экспорта
 * @returns {Promise<void>}
 */
export async function writeData(sheets: sheets_v4.Sheets, spreadsheetId: string, data: UserDataForExport[]): Promise<void> {
  try {
    // Извлекаем уникальные переменные для формирования структуры данных
    const uniqueVariables = extractUniqueVariables(data);
    
    // Преобразуем в формат, подходящий для Google Таблиц с динамическими столбцами
    const rows = data.map(user => {
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

      // Формируем строку данных
      const row = [
        user.id || '', // ID
        user.userId, // Telegram ID
        user.firstName || '', // Имя
        user.lastName || '', // Фамилия
        user.userName || '', // Username
        user.languageCode || '', // Язык
        user.isPremium || '', // Премиум
        user.lastInteraction, // Последняя активность
        user.interactionCount || '', // Кол-во взаимодействий
        user.createdAt || '', // Дата создания
        user.photoUrls || '', // URL фото
        user.mediaUrls || ''  // URL медиа
      ];

      // Добавляем значения для каждой переменной
      for (const variable of uniqueVariables) {
        let valueStr = '';
        
        if (parsedUserData && typeof parsedUserData === 'object' && variable in parsedUserData) {
          const responseValue = parsedUserData[variable];
          
          // Обработка различных форматов ответа
          if (typeof responseValue === 'object' && responseValue !== null) {
            // Если это объект с информацией об ответе
            if ('value' in responseValue) {
              valueStr = String((responseValue as any).value);
            } else if ('photoUrl' in responseValue) {
              valueStr = String((responseValue as any).photoUrl);
            } else if ('media' in responseValue) {
              // Если это медиа-ответ, преобразуем в строку URL-ов
              const mediaArray = (responseValue as any).media;
              if (Array.isArray(mediaArray)) {
                valueStr = mediaArray.map((m: any) => m.url || m).join(', ');
              } else {
                valueStr = JSON.stringify(responseValue);
              }
            } else {
              valueStr = JSON.stringify(responseValue);
            }
          } else {
            // Простое строковое значение
            valueStr = String(responseValue);
          }
        }
        
        row.push(valueStr);
      }

      return row;
    });

    // Определяем диапазон для данных (A2 до нужной буквы и строки)
    const columnCount = 12 + uniqueVariables.length; // 12 базовых столбцов + переменные
    
    // Преобразуем индекс столбца в буквенный формат Google Таблиц (A, B, ..., Z, AA, AB, ...)
    let endColumn = '';
    let idx = columnCount - 1; // индекс последнего столбца
    idx++; // Преобразуем к 1-индексации
    
    while (idx > 0) {
      idx--; // Уменьшаем на 1, чтобы работать с 0-25
      endColumn = String.fromCharCode(65 + (idx % 26)) + endColumn;
      idx = Math.floor(idx / 26);
    }
    
    const range = `A2:${endColumn}`;

    // Записываем данные, начиная со второй строки
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    });

    console.log(`Данные успешно записаны: ${data.length} записей, ${uniqueVariables.length} переменных`);
  } catch (error) {
    console.error('Ошибка записи данных:', error);
    throw new Error(`Failed to write data: ${(error as Error).message}`);
  }
}