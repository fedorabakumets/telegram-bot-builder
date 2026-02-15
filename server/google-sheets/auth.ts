/**
 * @fileoverview Модуль для аутентификации с Google Sheets API
 */

import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

// Путь к файлу учетных данных
const CREDENTIALS_PATH = path.resolve(process.cwd(), 'client', 'src', 'components', 'editor', 'credentials.json');

/**
 * Аутентификация с использованием OAuth 2.0
 *
 * @function authenticate
 * @returns {Promise<import('googleapis').sheets_v4.Sheets>} Экземпляр клиента Google Sheets API
 */
export async function authenticate() {
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
 * Получение URL для OAuth аутентификации
 *
 * @function getAuthUrl
 * @returns {Promise<string>} URL для аутентификации
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