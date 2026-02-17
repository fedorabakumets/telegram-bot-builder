/**
 * @fileoverview Модуль для экспорта структуры проекта бота в Google Таблицы
 *
 * Экспортирует метаданные проекта: узлы, связи, переменные, настройки.
 * Создаёт таблицу с несколькими листами для наглядного представления структуры.
 *
 * @version 1.0.0
 */

import { authenticate } from './auth';
import { sheets_v4 } from 'googleapis';

/**
 * Интерфейс данных узла для экспорта
 */
interface NodeExportData {
  id: string;
  type: string;
  x: number;
  y: number;
  description: string;
  variables: string;
}

/**
 * Интерфейс данных связи для экспорта
 */
interface ConnectionExportData {
  id: string;
  fromNode: string;
  toNode: string;
  condition: string;
  label: string;
}

/**
 * Интерфейс данных переменной для экспорта
 */
interface VariableExportData {
  name: string;
  type: string;
  defaultValue: string;
  usedInNodes: string;
}

/**
 * Экспорт структуры проекта в Google Таблицы
 *
 * @function exportStructureToGoogleSheets
 * @param {any} botData - Данные проекта (nodes, connections)
 * @param {string} projectName - Название проекта
 * @param {number} projectId - ID проекта
 * @returns {Promise<string>} ID созданной таблицы
 *
 * @description
 * Создаёт Google Таблицу с листами:
 * - Nodes: все узлы сценария
 * - Connections: связи между узлами
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

    // Создание таблицы
    const spreadsheetId = await createStructureSpreadsheet(sheets, projectName, projectId);

    // Подготовка данных
    const nodes = botData.nodes || [];
    const connections = botData.connections || [];

    // Экспорт листов
    await exportNodesSheet(sheets, spreadsheetId, nodes);
    await exportConnectionsSheet(sheets, spreadsheetId, connections);
    await exportVariablesSheet(sheets, spreadsheetId, nodes);
    await exportStatisticsSheet(sheets, spreadsheetId, nodes, connections);

    // Форматирование
    await formatStructureSheets(sheets, spreadsheetId);

    console.log(`✅ Экспорт структуры завершён. Таблица: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    return spreadsheetId;
  } catch (error) {
    console.error(`❌ Ошибка экспорта структуры проекта ${projectName}:`, error);
    throw error;
  }
}

/**
 * Создание таблицы для экспорта структуры
 */
async function createStructureSpreadsheet(
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
        { properties: { title: 'Connections', gridProperties: { rowCount: 100, columnCount: 10 } } },
        { properties: { title: 'Variables', gridProperties: { rowCount: 100, columnCount: 10 } } },
        { properties: { title: 'Statistics', gridProperties: { rowCount: 100, columnCount: 10 } } }
      ]
    },
    fields: 'spreadsheetId'
  });

  console.log(`📋 Создана таблица структуры с ID: ${response.data.spreadsheetId}`);
  return response.data.spreadsheetId as string;
}

/**
 * Экспорт листа с узлами
 */
async function exportNodesSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  nodes: any[]
): Promise<void> {
  const headers = [['ID', 'Type', 'X', 'Y', 'Description', 'Variables']];
  const rows = nodes.map(node => [
    node.id || '',
    node.type || 'unknown',
    node.x || 0,
    node.y || 0,
    node.data?.messageText || node.data?.description || '',
    node.data?.userVariableName || ''
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Nodes!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [...headers, ...rows]
    }
  });

  console.log(`📝 Экспортировано узлов: ${nodes.length}`);
}

/**
 * Экспорт листа со связями
 */
async function exportConnectionsSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  connections: any[]
): Promise<void> {
  const headers = [['ID', 'From Node', 'To Node', 'Condition', 'Label']];
  const rows = connections.map((conn, idx) => [
    idx + 1,
    conn.fromNodeId || '',
    conn.toNodeId || '',
    conn.condition || '',
    conn.label || ''
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Connections!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [...headers, ...rows]
    }
  });

  console.log(`🔗 Экспортировано связей: ${connections.length}`);
}

/**
 * Экспорт листа с переменными
 */
async function exportVariablesSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  nodes: any[]
): Promise<void> {
  const variablesMap = new Map<string, { type: string; nodes: string[] }>();

  nodes.forEach(node => {
    const varName = node.data?.userVariableName;
    if (varName) {
      if (!variablesMap.has(varName)) {
        variablesMap.set(varName, { type: node.type, nodes: [] });
      }
      variablesMap.get(varName)!.nodes.push(node.id || '');
    }
  });

  const headers = [['Name', 'Type', 'Used In Nodes']];
  const rows = Array.from(variablesMap.entries()).map(([name, data]) => [
    name,
    data.type,
    data.nodes.join(', ')
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Variables!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [...headers, ...rows]
    }
  });

  console.log(`📊 Экспортировано переменных: ${variablesMap.size}`);
}

/**
 * Экспорт листа со статистикой
 */
async function exportStatisticsSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  nodes: any[],
  connections: any[]
): Promise<void> {
  const nodeTypes = nodes.reduce((acc, node) => {
    const type = node.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const headers = [['Metric', 'Value']];
  const rows = [
    ['Total Nodes', nodes.length],
    ['Total Connections', connections.length],
    ['Node Types', Object.keys(nodeTypes).length],
    ...Object.entries(nodeTypes).map(([type, count]) => [`  ${type}`, count])
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Statistics!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [...headers, ...rows]
    }
  });

  console.log(`📈 Экспортирована статистика`);
}

/**
 * Форматирование таблицы структуры
 */
async function formatStructureSheets(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<void> {
  // Получаем информацию о таблице для получения ID листов
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0;

  const requests = [
    // Форматирование заголовков на первом листе
    {
      repeatCell: {
        range: {
          sheetId: firstSheetId,
          startRowIndex: 0,
          endRowIndex: 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
            textFormat: { bold: true, fontSize: 12 },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    },
    // Закрепление заголовков на первом листе
    {
      updateSheetProperties: {
        properties: { sheetId: firstSheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    // Автоширина столбцов на первом листе
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: firstSheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 6
        }
      }
    }
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests }
  });

  console.log('🎨 Форматирование завершено');
}
