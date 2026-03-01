/**
 * @fileoverview Утилита для идентификации узлов с множественным выбором
 *
 * Модуль предоставляет функцию для фильтрации узлов, требующих
 * логики обработки множественного выбора.
 *
 * @module bot-generator/Keyboard/identifyNodesRequiringMultiSelectLogic
 */

import type { EnhancedNode } from '../types/enhanced-node.types';
import { generatorLogger } from '../core/generator-logger';

/**
 * Идентифицирует узлы, требующие логики множественного выбора
 *
 * @param nodes - Массив узлов для проверки
 * @returns Массив узлов с включенным множественным выбором
 *
 * @example
 * const multiSelectNodes = identifyNodesRequiringMultiSelectLogic(nodes);
 */
export function identifyNodesRequiringMultiSelectLogic(
  nodes: EnhancedNode[]
): EnhancedNode[] {
  const multiSelectNodes = nodes
    .filter(node => node !== null && node !== undefined)
    .filter((node) => node.data?.allowMultipleSelection);

  generatorLogger.debug(`Найдено узлов с множественным выбором: ${multiSelectNodes.length}`, 
    multiSelectNodes.map((n) => n.id));

  return multiSelectNodes;
}