/**
 * @fileoverview Модуль для экспорта данных пользователей в Google Таблицы
 *
 * Этот модуль предоставляет функции для экспорта данных пользователей
 * в Google Таблицы с использованием OAuth-аутентификации.
 *
 * @module google-sheets-export
 */

import { sheets_v4 } from 'googleapis';
import { authenticate } from './auth';
import { createSpreadsheet, writeHeaders, writeData, UserDataForExport } from './data-writer';
import { formatHeaders } from './header-formatter';
import { formatData } from './data-formatter';
import { freezeHeaders, addFilters } from './structure-formatter';

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
 * Выполняет аутентификацию, создает таблицу, записывает заголовки и данные,
 * а также применяет форматирование.
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

    // Применение форматирования
    await formatHeaders(sheets, spreadsheetId);
    await formatData(sheets, spreadsheetId, data.length);
    await freezeHeaders(sheets, spreadsheetId);
    await addFilters(sheets, spreadsheetId);

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

// Экспортируем также функции для аутентификации
export { getAuthUrl, getToken } from './auth';