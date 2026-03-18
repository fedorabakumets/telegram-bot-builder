/**
 * @fileoverview Утилита для извлечения данных узлов
 *
 * Модуль предоставляет функцию для извлечения ID узлов и карты медиапеременных
 * из массива узлов бота.
 *
 * @module bot-generator/core/extract-node-data
 */

import type { Node } from '@shared/schema';
import { generatorLogger } from './generator-logger';
import { collectMediaVariables } from './collect-media-variables';

/**
 * Результат извлечения данных узлов
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
