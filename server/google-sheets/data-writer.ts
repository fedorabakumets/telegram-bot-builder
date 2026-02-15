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
 * Запись заголовков столбцов в Google Таблицу
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
      'Premium',
      'Последняя\nактивность',
      'Кол-во\nвзаимодействий',
      'Дата\nсоздания',
      'Данные\nпользователя\n(JSON)',
      'URL фото',
      'URL медиа'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1:M1', // Заголовки в первой строке
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    console.log('Заголовки успешно записаны');
  } catch (error) {
    console.error('Ошибка записи заголовков:', error);
    throw new Error(`Failed to write headers: ${(error as Error).message}`);
  }
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
    // Преобразуем данные в формат, подходящий для Google Таблиц
    const rows = data.map(user => [
      user.id,
      user.userId,
      user.firstName || '',
      user.lastName || '',
      user.userName || '',
      user.languageCode || '',
      user.isPremium,
      user.lastInteraction,
      user.interactionCount,
      user.createdAt,
      user.userData,
      user.photoUrls,
      user.mediaUrls
    ]);

    // Записываем данные, начиная со второй строки
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A2:M', // Начинаем со второй строки
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    });

    console.log(`Данные успешно записаны: ${data.length} записей`);
  } catch (error) {
    console.error('Ошибка записи данных:', error);
    throw new Error(`Failed to write data: ${(error as Error).message}`);
  }
}