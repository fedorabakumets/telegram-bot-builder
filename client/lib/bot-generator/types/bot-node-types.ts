/**
 * @fileoverview Типы для узлов бота
 * 
 * Модуль определяет базовую структуру узла графа бота и связанные типы.
 * Используется для типизации данных узлов при генерации Python-кода.
 * 
 * @module bot-generator/types/bot-node-types
 */

import type { Button } from './button-types';
import type { NodeData } from './node-data.types';

/**
 * Узел бота в графе
 * 
 * @example
 * const node: BotNode = {
 *   id: 'start_1',
 *   type: 'start',
 *   data: { text: 'Привет!', buttons: [] }
 * };
 */
export interface BotNode {
  /** Уникальный идентификатор узла */
  id: string;
  /** Тип узла: "start", "message", "command", "photo", и т.д. */
  type: string;
  /** Данные узла */
  data: NodeData;
  /** Позиция X на холсте редактора */
  position?: { x: number; y: number };
  /** Дополнительные поля узла */
  [key: string]: any;
}

/**
 * Массив узлов бота
 * 
 * @example
 * const nodes: BotNode[] = [...];
 */
export type BotNodeArray = BotNode[];
