/**
 * @fileoverview Модуль для экспорта структуры проекта в Google Таблицы
 *
 * Извлекает узлы из структуры sheets и подготавливает к экспорту.
 *
 * @version 1.0.0
 */

/**
 * Извлечение узлов из массива sheets
 *
 * @function extractStructureData
 * @param {any} botData - Данные проекта (sheets[].nodes)
 * @returns {{nodes: any[], sheetsCount: number}} Объект с извлечёнными данными
 */
export function extractStructureData(botData: any): { nodes: any[]; sheetsCount: number } {
  const sheetsArray = botData.sheets || [];
  const allNodes: any[] = [];

  sheetsArray.forEach((sheet: any) => {
    const sheetName = sheet.name || sheet.id || 'Unknown';
    (sheet.nodes || []).forEach((node: any) => {
      allNodes.push({ ...node, _sheetName: sheetName });
    });
  });

  return {
    nodes: allNodes,
    sheetsCount: sheetsArray.length
  };
}
