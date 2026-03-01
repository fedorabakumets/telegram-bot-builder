/**
 * @fileoverview Утилита для логирования изменения типа узла
 *
 * Фиксирует изменение типа узла (например, message → command).
 *
 * @module node-type-change-logger
 */

import { Node } from '@shared/schema';

/**
 * Параметры для логирования изменения типа узла
 */
export interface NodeTypeChangeLogOptions {
  /** Узел, у которого изменён тип */
  node: Node;
  /** Предыдущий тип узла */
  oldType: Node['type'];
  /** Новый тип узла */
  newType: Node['type'];
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует изменение типа узла в историю действий
 *
 * @param {NodeTypeChangeLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logNodeTypeChange({
 *   node: selectedNode,
 *   oldType: 'message',
 *   newType: 'command',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logNodeTypeChange({ node, oldType, newType, onActionLog }: NodeTypeChangeLogOptions): void {
  onActionLog('type_change', `Изменён тип узла "${oldType}" → "${newType}" (${node.id})`);
}
