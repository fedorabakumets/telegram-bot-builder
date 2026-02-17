/**
 * @fileoverview Модуль для экспорта структуры проекта бота в Google Таблицы
 *
 * Экспортирует метаданные проекта: узлы, переменные, статистику.
 * Создаёт таблицу с несколькими листами для наглядного представления структуры.
 *
 * @version 1.0.0
 */

import { authenticate } from './auth';
import { extractStructureData } from './structure-exporter';
import { createStructureSpreadsheet } from './structure-creator';
import { exportNodesSheet } from './structure-nodes-exporter';
import { exportVariablesSheet, exportStatisticsSheet } from './structure-stats-exporter';
import { formatStructureSheets } from './structure-formatter';

/**
 * Экспорт структуры проекта в Google Таблицы
 *
 * @function exportStructureToGoogleSheets
 * @param {any} botData - Данные проекта (sheets[].nodes, sheets[].connections)
 * @param {string} projectName - Название проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<string>} ID созданной таблицы
 *
 * @description
 * Создаёт Google Таблицу с листами:
 * - Nodes: все узлы сценария
 * - Variables: переменные проекта
 * - Statistics: статистика проекта
 */
export async function exportStructureToGoogleSheets(
  botData: any,
  projectName: string,
  projectId: number
): Promise<string> {
  console.log(`📊 Начинаем экспорт структуры проекта: ${projectName} (ID: ${projectId})`);

  try {
    const sheets = await authenticate();
    const spreadsheetId = await createStructureSpreadsheet(sheets, projectName, projectId);

    const { nodes, sheetsCount } = extractStructureData(botData);

    await exportNodesSheet(sheets, spreadsheetId, nodes);
    await exportVariablesSheet(sheets, spreadsheetId, nodes);
    await exportStatisticsSheet(sheets, spreadsheetId, nodes, sheetsCount);
    await formatStructureSheets(sheets, spreadsheetId);

    console.log(`✅ Экспорт структуры завершён. Таблица: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    return spreadsheetId;
  } catch (error) {
    console.error(`❌ Ошибка экспорта структуры проекта ${projectName}:`, error);
    throw error;
  }
}
