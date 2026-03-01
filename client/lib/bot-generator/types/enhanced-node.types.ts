/**
 * @fileoverview Улучшенные типы узлов для совместимости со схемой
 * 
 * Модуль предоставляет типы для совместимости между NodeData и Node из @shared/schema.
 * Используется для устранения ошибок типизации при генерации кода.
 * 
 * @module bot-generator/types/enhanced-node-types
 */

import type { Node } from '@shared/schema';
import type { NodeData } from './node-data.types';

/**
 * Улучшенный тип узла с совместимыми данными
 * 
 * @example
 * const node: EnhancedNode = {
 *   id: 'start_1',
 *   type: 'start',
 *   position: { x: 0, y: 0 },
 *   data: { text: 'Привет!', buttons: [] }
 * };
 */
export type EnhancedNode = Node & {
  /** Данные узла с расширенной типизацией */
  data: NodeData & Node['data'];
};

/**
 * Массив улучшенных узлов
 * 
 * @example
 * const nodes: EnhancedNode[] = [...];
 */
export type EnhancedNodeArray = EnhancedNode[];
