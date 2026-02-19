/**
 * @fileoverview Утилиты для работы с узлами
 * Для Telegram Bot Builder.
 * @module node-utils
 */

import { Node } from '@shared/schema';

/** Результат получения узлов из всех листов */
export interface NodeWithSheet {
  node: Node;
  sheetId: string;
  sheetName: string;
}

/**
 * Получает все узлы из всех листов проекта.
 * Используется для межлистовых соединений и проверки дубликатов.
 * @param {any[]} allSheets - Все листы проекта
 * @param {Node[]} allNodes - Узлы текущего листа
 * @param {string} currentSheetId - ID текущего листа
 * @returns {NodeWithSheet[]} Массив узлов с метаданными листов
 */
export function collectAllNodesFromSheets(
  allSheets: any[] | undefined,
  allNodes: Node[],
  currentSheetId: string | undefined
): NodeWithSheet[] {
  const allNodesFromSheets: NodeWithSheet[] = [];

  if (allSheets && allSheets.length > 0) {
    allSheets.forEach((sheet: any) => {
      if (sheet.nodes) {
        sheet.nodes.forEach((node: Node) => {
          allNodesFromSheets.push({
            node,
            sheetId: sheet.id,
            sheetName: sheet.name
          });
        });
      }
    });
  } else {
    allNodes.forEach((node: Node) => {
      allNodesFromSheets.push({
        node,
        sheetId: currentSheetId || 'current',
        sheetName: 'Текущий лист'
      });
    });
  }

  return allNodesFromSheets;
}
