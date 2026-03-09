/**
 * @fileoverview Утилита для извлечения данных узлов
 *
 * Модуль предоставляет функцию для извлечения ID узлов и карты медиапеременных
 * из массива узлов бота.
 *
 * @module bot-generator/utils/extractNodeData
 */

import type { Node } from '@shared/schema';
import { generatorLogger } from '../core/generator-logger';
import { collectMediaVariables } from './collectMediaVariables';

/**
 * Результат извлечения данных узлов
 *
 * @example
 * const result: ExtractNodeDataResult = {
 *   allNodeIds: ['start_1', 'menu_2'],
 *   mediaVariablesMap: new Map()
 * };
 */
export interface ExtractNodeDataResult {
  /** Массив всех ID узлов */
  allNodeIds: string[];
  /** Карта медиапеременных */
  mediaVariablesMap: Map<string, { type: string; variable: string }>;
}

/**
 * Извлекает идентификаторы узлов и карту медиапеременных
 *
 * @param nodes - Массив узлов для извлечения данных
 * @returns Объект с идентификаторами узлов и картой медиапеременных
 *
 * @example
 * const { allNodeIds, mediaVariablesMap } = extractNodeData(nodes);
 */
export function extractNodeData(nodes: Node[]): ExtractNodeDataResult {
  const allNodeIds = nodes ? nodes.map(node => node.id) : [];
  const mediaVariablesMap = collectMediaVariables(nodes || []);
  
  generatorLogger.debug(`Собрано медиапеременных: ${mediaVariablesMap.size}`);
  if (mediaVariablesMap.size > 0) {
    generatorLogger.debug('Медиапеременные', Array.from(mediaVariablesMap.entries()));
  }

  return { allNodeIds, mediaVariablesMap };
}
