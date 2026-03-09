/**
 * @fileoverview Параметры для проверки автоперехода
 * Используется в функциях генерации кода автоперехода
 */

import type { TransitionNode } from './transition-node';
import type { Connection } from '../../node-navigation/utils/navigation-helpers';

/**
 * Параметры для проверки автоперехода
 */
export interface AutoTransitionCheckParams {
  /** ID текущего узла */
  nodeId: string;
  /** Данные текущего узла */
  targetNode: TransitionNode;
  /** Массив всех узлов */
  nodes: TransitionNode[];
  /** Массив соединений */
  connections: Connection[];
}
