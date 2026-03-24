/**
 * @fileoverview Фабрика контекста генерации Python-кода бота
 * 
 * Модуль предоставляет функции для создания контекста генерации
 * из данных бота и опций.
 * 
 * @module bot-generator/core/create-generation-context
 */

import type { BotData, BotGroup } from '@shared/schema';
import type { EnhancedNode } from '../types/enhanced-node.types';
import type { GenerationOptions } from './generation-options.types';
import type { GenerationContext } from './generation-context';
import { createGenerationState } from './generation-state';
import { toEnhancedNodes } from './to-enhanced-node';
import { collectMediaVariables } from './collect-media-variables';
import { extractNodesAndConnections } from './extract-nodes-and-connections';
import { normalizeKeyboardBindings } from './normalize-keyboard-bindings';

/**
 * Извлекает все ID узлов из массива узлов
 * 
 * @param nodes - Массив узлов
 * @returns Массив ID узлов
 * 
 * @example
 * const ids = extractAllNodeIds(nodes);
 */
function extractAllNodeIds(nodes: EnhancedNode[]): string[] {
  return nodes.map((node) => node.id);
}

/**
 * Создаёт контекст генерации из данных бота
 * 
 * @param botData - Данные бота из проекта
 * @param botName - Имя бота
 * @param groups - Группы бота
 * @param options - Опции генерации
 * @returns Контекст генерации
 * 
 * @example
 * const context = createGenerationContext(botData, 'MyBot', groups, options);
 */
export function createGenerationContext(
  botData: BotData,
  botName: string,
  groups: BotGroup[],
  options: GenerationOptions
): GenerationContext {
  // Используем extractNodesAndConnections для поддержки как nodes[], так и sheets[]
  const { nodes: rawNodes, connections } = extractNodesAndConnections(botData as any);
  const normalizedNodes = normalizeKeyboardBindings(rawNodes, connections);
  const nodes = toEnhancedNodes(normalizedNodes);
  const allNodeIds = extractAllNodeIds(nodes);
  const mediaVariablesMap = collectMediaVariables(nodes);
  const state = createGenerationState(options);

  return {
    nodes,
    allNodeIds,
    mediaVariablesMap,
    botName,
    groups,
    options,
    state,
    projectId: options.projectId ?? null,
  };
}

/**
 * Создаёт контекст генерации из EnhancedNode[]
 * 
 * @param nodes - Массив узлов EnhancedNode
 * @param botName - Имя бота
 * @param groups - Группы бота
 * @param options - Опции генерации
 * @returns Контекст генерации
 * 
 * @example
 * const context = createGenerationContextFromNodes(nodes, 'MyBot', groups);
 */
export function createGenerationContextFromNodes(
  nodes: EnhancedNode[],
  botName: string,
  groups: BotGroup[] = [],
  options: GenerationOptions = {},
  connections: Array<{ id: string; source: string; target: string }> = []
): GenerationContext {
  const normalizedNodes = normalizeKeyboardBindings(nodes as any, connections as any);
  const enhancedNodes = toEnhancedNodes(normalizedNodes as any);
  const allNodeIds = extractAllNodeIds(enhancedNodes);
  const mediaVariablesMap = collectMediaVariables(enhancedNodes);
  const state = createGenerationState(options);

  return {
    nodes: enhancedNodes,
    allNodeIds,
    mediaVariablesMap,
    botName,
    groups,
    options,
    state,
    projectId: options.projectId ?? null,
  };
}
