/**
 * @fileoverview Модуль для экспорта структуры проекта в Google Таблицы
 *
 * Извлекает данные из структуры sheets и подготавливает к экспорту.
 *
 * @version 1.0.0
 */

/**
 * Извлечение узлов и связей из массива sheets
 *
 * @function extractStructureData
 * @param {any} botData - Данные проекта (sheets[].nodes, sheets[].connections)
 * @returns {{nodes: any[], connections: any[], sheetsCount: number}} Объект с извлечёнными данными
 */
export function extractStructureData(botData: any): { nodes: any[]; connections: any[]; sheetsCount: number } {
  const sheetsArray = botData.sheets || [];
  const allNodes: any[] = [];
  const allConnections: any[] = [];

  sheetsArray.forEach((sheet: any) => {
    const sheetName = sheet.name || sheet.id || 'Unknown';
    (sheet.nodes || []).forEach((node: any) => {
      allNodes.push({ ...node, _sheetName: sheetName });
    });
    (sheet.connections || []).forEach((conn: any) => {
      allConnections.push({ ...conn, _sheetName: sheetName });
    });
  });

  return {
    nodes: allNodes,
    connections: allConnections,
    sheetsCount: sheetsArray.length
  };
}
