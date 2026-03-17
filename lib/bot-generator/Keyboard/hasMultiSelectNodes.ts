/**
 * @fileoverview Утилита для проверки наличия узлов с множественным выбором
 *
 * @module bot-generator/Keyboard/hasMultiSelectNodes
 */

import type { EnhancedNode } from '../types/enhanced-node.types';

/**
 * Проверяет, есть ли в массиве узлы с множественным выбором
 * (allowMultipleSelection или кнопки с action 'selection'/'complete')
 *
 * @param nodes - Массив узлов для проверки
 * @returns true если хотя бы один узел требует логики множественного выбора
 */
export function hasMultiSelectNodes(nodes: EnhancedNode[]): boolean {
  return nodes.some((node) => {
    if (!node?.data) return false;

    if (node.data.allowMultipleSelection) return true;

    const buttons = node.data.buttons ?? [];
    return buttons.some(
      (btn: { action?: string }) =>
        btn.action === 'selection' || btn.action === 'complete'
    );
  });
}
