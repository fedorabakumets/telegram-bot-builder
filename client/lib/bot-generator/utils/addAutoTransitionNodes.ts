/**
 * @fileoverview Утилита для добавления целевых узлов автопереходов
 * 
 * Модуль предоставляет функцию для добавления ID узлов автоперехода
 * в множество ссылочных узлов при генерации кода.
 * 
 * @module bot-generator/utils/addAutoTransitionNodes
 */

import type { Node } from '@shared/schema';
import { isLoggingEnabled } from '../../bot-generator';

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
  nodes: Node[],
  allReferencedNodeIds: Set<string>
): void {
  const loggingEnabled = isLoggingEnabled();

  nodes
    .filter(node => node !== null && node !== undefined)
    .forEach(node => {
      if (node.data?.enableAutoTransition && node.data?.autoTransitionTo) {
        allReferencedNodeIds.add(node.data.autoTransitionTo);
        if (loggingEnabled) {
          console.log(`✅ ГЕНЕРАТОР: Добавлен autoTransitionTo ${node.data.autoTransitionTo} в allReferencedNodeIds`);
        }
      }
    });
}
