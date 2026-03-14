/**
 * @fileoverview Параметры для генерации навигации
 * Используется в функциях навигации по узлам графа
 */

import type { TransitionNode } from './transition-node';
import type { Connection } from '../../node-navigation/utils/navigation-helpers';

/**
 * Параметры для генерации навигации
 */
export interface NavigationParams {
  /** Массив узлов для навигации */
  nodes: TransitionNode[];
  /** Массив соединений */
  connections: Connection[];
  /** Массив всех ID узлов */
  allNodeIds: string[];
}
