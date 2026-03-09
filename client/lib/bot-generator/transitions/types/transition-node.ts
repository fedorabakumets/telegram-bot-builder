/**
 * @fileoverview Тип узла для генерации переходов
 * Обёртка над Node с типизированными данными
 */

import type { Node } from '@shared/schema';
import type { NodeData } from './node-data';

/**
 * Параметры узла для генерации переходов
 */
export interface TransitionNode {
  /** Уникальный идентификатор узла */
  id: string;
  /** Тип узла */
  type: Node['type'];
  /** Данные узла */
  data: NodeData;
}
