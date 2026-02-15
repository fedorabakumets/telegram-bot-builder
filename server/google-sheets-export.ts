/**
 * @fileoverview Модуль для экспорта данных пользователей в Google Таблицы
 *
 * Этот модуль предоставляет функции для экспорта данных пользователей
 * в Google Таблицы с использованием OAuth-аутентификации.
 *
 * @module google-sheets-export
 */

import fs from 'fs/promises';
import path from 'path';
import { google, sheets_v4 } from 'googleapis';

// Путь к файлу учетных данных
const CREDENTIALS_PATH = path.resolve(process.cwd(), 'client', 'src', 'components', 'editor', 'credentials.json');

/**
 * Интерфейс для данных пользователя, экспортируемых в Google Таблицы
 */
interface UserDataForExport {
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
 * Аутентификация с использованием OAuth 2.0
 * 
 * @function authenticate
 * @returns {Promise< sheets_v4.Sheets>} Экземпляр клиента Google Sheets API
 * 
 * @description
 * Загружает учетные данные из файла credentials.json и создает
 * аутентифицированный клиент для доступа к Google Sheets API.
 */
async function authenticate(): Promise<sheets_v4.Sheets> {
  try {
    // Чтение учетных данных
    const credentialsContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    const { client_secret, client_id, redirect_uris } = credentials.web;
    
    // Создание OAuth2 клиента
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] // обычно 'http://localhost:3000/oauth2callback'
    );
    
    // Проверка наличия токена доступа в файле
    const tokenPath = path.resolve(process.cwd(), 'client', 'src', 'components', 'editor', 'token.json');
    
    try {
      const tokenContent = await fs.readFile(tokenPath, 'utf8');
      const token = JSON.parse(tokenContent);
      oAuth2Client.setCredentials(token);
      
      // Проверяем, действителен ли токен
      const accessToken = await oAuth2Client.getAccessToken();
      if (!accessToken.token) {
        console.log('Токен доступа недействителен или истек срок действия. Требуется повторная аутентификация...');
        throw new Error('Access token is invalid or expired');
      }
    } catch (tokenError) {
      console.log('Требуется аутентификация OAuth. Файл токена не найден или недействителен...');
      throw new Error('OAuth token not found or invalid. Please authenticate first.');
    }
    
    // Создание клиента Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    
    return sheets;
  } catch (error) {
    console.error('Ошибка аутентификации Google Sheets API:', error);
    // Не оборачиваем ошибку в другую ошибку, а передаем оригинальное сообщение
    if ((error as Error).message.includes('OAuth token not found or invalid')) {
      throw error; // Перебрасываем оригинальную ошибку
    }
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
}

/**
 * Создание новой Google Таблицы для экспорта данных
 * 
 * @function createSpreadsheet
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} projectName - Название проекта, которое будет использоваться в названии таблицы
 * @param {number} projectId - ID проекта, добавляется к названию таблицы для уникальности
 * @returns {Promise<string>} ID созданной таблицы
 * 
 * @description
 * Создает новую Google Таблицу с уникальным названием на основе
 * названия проекта и ID проекта.
 */
async function createSpreadsheet(sheets: sheets_v4.Sheets, projectName: string, projectId: number): Promise<string> {
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
 * 
 * @description
 * Записывает заголовки столбцов в первую строку Google Таблицы.
 * Заголовки соответствуют полям объекта UserDataForExport.
 */
async function writeHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<void> {
  try {
    const headers = [
      'ID',
      'Telegram ID',
      'Имя',
      'Фамилия',
      'Username',
      'Язык',
      'Premium',
      'Последняя активность',
      'Количество взаимодействий',
      'Дата создания',
      'Данные пользователя (JSON)',
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
 * 
 * @description
 * Записывает данные пользователей, начиная со второй строки таблицы.
 * Каждый объект UserDataForExport становится строкой в таблице.
 */
async function writeData(sheets: sheets_v4.Sheets, spreadsheetId: string, data: UserDataForExport[]): Promise<void> {
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

/**
 * Экспорт данных пользователей в Google Таблицы
 * 
 * @function exportToGoogleSheets
 * @param {any[]} data - Массив данных пользователей для экспорта
 * @param {string} projectName - Название проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<void>}
 * 
 * @description
 * Основная функция для экспорта данных пользователей в Google Таблицы.
 * Выполняет аутентификацию, создает таблицу, записывает заголовки и данные.
 * 
 * @example
 * ```typescript
 * await exportToGoogleSheets(userData, "Мой проект", 123);
 * ```
 */
export async function exportToGoogleSheets(data: any[], projectName: string, projectId: number): Promise<void> {
  console.log(`Начинаем экспорт данных для проекта: ${projectName} (ID: ${projectId})`);
  
  try {
    // Аутентификация с Google Sheets API
    const sheets = await authenticate();
    
    // Создание новой таблицы
    const spreadsheetId = await createSpreadsheet(sheets, projectName, projectId);
    
    // Запись заголовков
    await writeHeaders(sheets, spreadsheetId);
    
    // Запись данных
    await writeData(sheets, spreadsheetId, data as UserDataForExport[]);
    
    console.log(`Экспорт завершен успешно. Таблица: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
  } catch (error) {
    console.error(`Ошибка экспорта данных проекта ${projectName} (ID: ${projectId}):`, error);
    
    // Если ошибка связана с аутентификацией, выбрасываем специальное сообщение
    if ((error as Error).message.includes('OAuth token not found or invalid') || 
        (error as Error).message.includes('Access token is invalid or expired')) {
      throw new Error('OAuth token not found or invalid. Please authenticate first.');
    }
    
    throw error;
  }
}

/**
 * Получение URL для OAuth аутентификации
 * 
 * @function getAuthUrl
 * @returns {Promise<string>} URL для аутентификации
 * 
 * @description
 * Возвращает URL, по которому пользователь должен пройти для
 * предоставления доступа приложению к Google Sheets API.
 */
export async function getAuthUrl(): Promise<string> {
  try {
    const credentialsContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    const { client_secret, client_id, redirect_uris } = credentials.web;
    
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
    });
    
    return authUrl;
  } catch (error) {
    console.error('Ошибка получения URL аутентификации:', error);
    throw new Error(`Failed to get auth URL: ${(error as Error).message}`);
  }
}

/**
 * Получение токена доступа с использованием кода авторизации
 * 
 * @function getToken
 * @param {string} code - Код авторизации, полученный после аутентификации
 * @returns {Promise<object>} Токен доступа
 * 
 * @description
 * Обменивает код авторизации на токен доступа и сохраняет его
 * в файл token.json для дальнейшего использования.
 */
export async function getToken(code: string): Promise<object> {
  try {
    const credentialsContent = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    const { client_secret, client_id, redirect_uris } = credentials.web;
    
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // Сохраняем токены в файл
    const tokenPath = path.resolve(process.cwd(), 'client', 'src', 'components', 'editor', 'token.json');
    await fs.writeFile(tokenPath, JSON.stringify(tokens));
    
    console.log('Токен успешно получен и сохранен');
    
    return tokens;
  } catch (error) {
    console.error('Ошибка получения токена:', error);
    throw new Error(`Failed to get token: ${(error as Error).message}`);
  }
}