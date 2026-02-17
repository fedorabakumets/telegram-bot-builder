/**
 * @fileoverview Модуль для экспорта узлов в Google Таблицы
 *
 * Экспортирует узлы сценария в лист Nodes.
 *
 * @version 1.0.0
 */

import { sheets_v4 } from 'googleapis';

/**
 * Экспорт листа с узлами
 *
 * @function exportNodesSheet
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 * @param {any[]} nodes - Массив узлов для экспорта
 */
export async function exportNodesSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  nodes: any[]
): Promise<void> {
  const headers = [['Sheet', 'ID', 'Type', 'X', 'Y', 'Description', 'Variable']];
  const rows = nodes.map(node => [
    node._sheetName || '',
    node.id || '',
    node.type || 'unknown',
    node.position?.x || node.x || 0,
    node.position?.y || node.y || 0,
    node.data?.messageText || node.data?.description || '',
    node.data?.multiSelectVariable || node.data?.inputVariable || ''
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Nodes!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [...headers, ...rows] }
  });

  console.log(`📝 Экспортировано узлов: ${nodes.length}`);
}
