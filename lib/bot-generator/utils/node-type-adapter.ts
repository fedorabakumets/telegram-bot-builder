/**
 * @fileoverview Адаптер типов узлов для совместимости
 * 
 * Модуль предоставляет функции-обёртки для совместимости
 * между типами Node из @shared/schema и BotNode.
 * 
 * @module bot-generator/utils/node-type-adapter
 */

import type { Node } from '@shared/schema';

/**
 * Адаптирует функцию для работы с узлами типа Node
 * 
 * @template T - Тип возвращаемого значения
 * @param fn - Функция для адаптации
 * @returns Адаптированная функция
 */
export type NodeAdapterFunction<T> = (
  nodes: Node[],
  allNodeIds: string[],
  isLoggingEnabled: () => boolean
) => T;

/**
 * Адаптирует функцию для работы с множественным выбором
 * 
 * @template T - Тип возвращаемого значения
 * @param fn - Функция для адаптации
 * @returns Адаптированная функция
 */
export type MultiSelectAdapterFunction<T> = (
  nodes: Node[],
  multiSelectNodes: Node[],
  allNodeIds: string[],
  isLoggingEnabled: () => boolean
) => T;
