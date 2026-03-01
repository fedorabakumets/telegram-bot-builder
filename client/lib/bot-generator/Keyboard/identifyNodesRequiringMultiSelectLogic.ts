/**
 * @fileoverview Утилита для идентификации узлов с множественным выбором
 *
 * Модуль предоставляет функцию для фильтрации узлов, требующих
 * логики обработки множественного выбора.
 *
 * @module bot-generator/Keyboard/identifyNodesRequiringMultiSelectLogic
 */

import type { EnhancedNode } from '../types/enhanced-node.types';

/**
 * Идентифицирует узлы, требующие логики множественного выбора
 *
 * @param nodes - Массив узлов для проверки
 * @param isLoggingEnabledFn - Функция проверки включения логирования
 * @returns Массив узлов с включенным множественным выбором
 *
 * @example
 * const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(nodes, () => true);
 */
export function identifyNodesRequiringMultiSelectLogic(
  nodes: EnhancedNode[],
  isLoggingEnabledFn: () => boolean
): EnhancedNode[] {
  const multiSelectNodes = nodes
    .filter(node => node !== null && node !== undefined)
    .filter((node) => node.data?.allowMultipleSelection);
    
  if (isLoggingEnabledFn()) {
    console.log(
      `🔍 ГЕНЕРАТОР: Найдено ${multiSelectNodes.length} узлов с множественным выбором:`,
      multiSelectNodes.map((n) => n.id)
    );
  }
  
  return multiSelectNodes;
}