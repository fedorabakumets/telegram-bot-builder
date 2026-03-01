/**
 * @fileoverview Утилита для сбора целевых узлов ввода
 * 
 * Модуль предоставляет функцию для сбора ID целевых узлов ввода
 * из всех узлов бота в множество.
 * 
 * @module bot-generator/utils/collectInputTargetNodes
 */

import type { BotNode } from '../types';

/**
 * Собирает целевые узлы ввода в множество
 * 
 * @param nodes - Массив узлов для извлечения целевых узлов ввода
 * @returns Множество идентификаторов целевых узлов ввода
 * 
 * @example
 * const inputTargets = collectInputTargetNodes(nodes);
 */
export function collectInputTargetNodes(nodes: BotNode[]): Set<string> {
  const inputTargetNodeIds = new Set<string>();
  
  nodes
    .filter(node => node !== null && node !== undefined)
    .forEach(node => {
      if (node.data?.inputTargetNodeId) {
        inputTargetNodeIds.add(node.data.inputTargetNodeId);
      }
    });

  return inputTargetNodeIds;
}
