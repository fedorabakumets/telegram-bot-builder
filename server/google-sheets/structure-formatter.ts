/**
 * @fileoverview Модуль для форматирования таблицы структуры
 *
 * Форматирует заголовки, закрепляет строки, настраивает ширину столбцов.
 *
 * @version 1.0.0
 */

import { sheets_v4 } from 'googleapis';

/**
 * Форматирование таблицы структуры
 *
 * @function formatStructureSheets
 * @param {sheets_v4.Sheets} sheets - Экземпляр клиента Google Sheets API
 * @param {string} spreadsheetId - ID таблицы
 */
export async function formatStructureSheets(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<void> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0;

  const requests = [
    {
      repeatCell: {
        range: { sheetId: firstSheetId, startRowIndex: 0, endRowIndex: 1 },
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
    {
      updateSheetProperties: {
        properties: { sheetId: firstSheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    {
      autoResizeDimensions: {
        dimensions: { sheetId: firstSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 6 }
      }
    }
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  console.log('🎨 Форматирование завершено');
}
