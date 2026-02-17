/**
 * @fileoverview Модуль для экспорта переменных и статистики
 *
 * Анализирует узлы и создаёт листы Variables и Statistics.
 *
 * @version 1.0.0
 */

import { sheets_v4 } from 'googleapis';

/**
 * Экспорт листа с переменными
 *
 * @function exportVariablesSheet
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {any[]} nodes - Массив узлов для анализа переменных
 */
export async function exportVariablesSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  nodes: any[]
): Promise<void> {
  const variablesMap = new Map<string, { type: string; nodes: string[] }>();

  nodes.forEach(node => {
    // Поддержка как inputVariable, так и multiSelectVariable
    const varName = node.data?.multiSelectVariable || node.data?.inputVariable;
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
    requestBody: { values: [...headers, ...rows] }
  });

  console.log(`📊 Экспортировано переменных: ${variablesMap.size}`);
}

/**
 * Экспорт листа со статистикой
 *
 * @function exportStatisticsSheet
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {any[]} nodes - Массив узлов
 * @param {number} sheetsCount - Количество листов в проекте
 */
export async function exportStatisticsSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  nodes: any[],
  sheetsCount: number
): Promise<void> {
  const nodeTypes = nodes.reduce((acc, node) => {
    const type = node.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const headers = [['Metric', 'Value']];
  const rows = [
    ['Total Sheets', sheetsCount],
    ['Total Nodes', nodes.length],
    ['Node Types', Object.keys(nodeTypes).length],
    ...Object.entries(nodeTypes).map(([type, count]) => [`  ${type}`, count])
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Statistics!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [...headers, ...rows] }
  });

  console.log(`📈 Экспортирована статистика`);
}
