/**
 * @fileoverview Утилита для добавления целевых узлов автопереходов
 *
 * Модуль предоставляет функцию для добавления ID узлов автоперехода
 * в множество ссылочных узлов при генерации кода.
 *
 * @module bot-generator/core/add-auto-transition-nodes
 */

import type { EnhancedNode } from '../types/enhanced-node.types';
import { generatorLogger } from './generator-logger';

/**
 * Добавляет целевые узлы автопереходов в множество ссылочных узлов
 *
 * @param nodes - Массив узлов для обработки
 * @param allReferencedNodeIds - Множество идентификаторов узлов для обновления
 *
 * @example
 * addAutoTransitionNodes(nodes, allReferencedNodeIds);
 */
export function addAutoTransitionNodes(
  nodes: EnhancedNode[],
  allReferencedNodeIds: Set<string>
): void {
  nodes
    .filter(node => node !== null && node !== undefined)
    .forEach(node => {
      if (node.data?.enableAutoTransition && node.data?.autoTransitionTo) {
        allReferencedNodeIds.add(node.data.autoTransitionTo);
        generatorLogger.debug(`Добавлен autoTransitionTo: ${node.data.autoTransitionTo}`);
      }
    });
}
