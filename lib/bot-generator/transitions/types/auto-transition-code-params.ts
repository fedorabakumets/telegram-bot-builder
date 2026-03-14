/**
 * @fileoverview Параметры для генерации кода автоперехода
 * Используется в функциях выполнения автоперехода
 */

import type { TransitionNode } from './transition-node';

/**
 * Параметры для генерации кода автоперехода
 */
export interface AutoTransitionCodeParams {
  /** Цель автоперехода (ID узла) */
  autoTransitionTarget: string;
  /** ID текущего узла */
  nodeId: string;
  /** Массив всех узлов для проверки существования */
  nodes: TransitionNode[];
}
