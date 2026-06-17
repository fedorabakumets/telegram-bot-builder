/**
 * @fileoverview Поиск листа по ID узла на канвасе
 * @module pages/editor/utils/find-sheet-by-node-id
 */

import type { CanvasSheet } from '@shared/schema';

/**
 * Находит ID листа, содержащего узел с указанным ID
 * @param sheets - Список листов проекта
 * @param nodeId - ID узла для поиска
 * @returns ID листа или null, если узел не найден
 */
export function findSheetIdByNodeId(sheets: CanvasSheet[], nodeId: string): string | null {
  const sheet = sheets.find(s => s.nodes.some(node => node.id === nodeId));
  return sheet?.id ?? null;
}
