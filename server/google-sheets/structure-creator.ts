/**
 * @fileoverview Модуль для создания Google Таблицы структуры проекта
 *
 * Создаёт таблицу с 3 листами: Nodes, Variables, Statistics.
 *
 * @version 1.0.0
 */

import { sheets_v4 } from 'googleapis';

/**
 * Создание таблицы для экспорта структуры
 *
 * @function createStructureSpreadsheet
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} projectName - Название проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<string>} ID созданной таблицы
 */
export async function createStructureSpreadsheet(
  sheets: sheets_v4.Sheets,
  projectName: string,
  projectId: number
): Promise<string> {
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `${projectName} - Structure Export (Project ${projectId}) - ${new Date().toISOString().split('T')[0]}`
      },
      sheets: [
        { properties: { title: 'Nodes', gridProperties: { rowCount: 100, columnCount: 10 } } },
        { properties: { title: 'Variables', gridProperties: { rowCount: 100, columnCount: 10 } } },
        { properties: { title: 'Statistics', gridProperties: { rowCount: 100, columnCount: 10 } } }
      ]
    },
    fields: 'spreadsheetId'
  });

  console.log(`📋 Создана таблица структуры с ID: ${response.data.spreadsheetId}`);
  return response.data.spreadsheetId as string;
}
