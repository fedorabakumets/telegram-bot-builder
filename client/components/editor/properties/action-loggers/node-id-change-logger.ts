/**
 * @fileoverview Утилита для логирования изменения ID узла
 *
 * Фиксирует изменение идентификатора узла.
 *
 * @module node-id-change-logger
 */

import { Node } from '@shared/schema';

/**
 * Параметры для логирования изменения ID узла
 */
export interface NodeIdChangeLogOptions {
  /** Узел, у которого изменён ID */
  node: Node;
  /** Предыдущий ID узла */
  oldId: string;
  /** Новый ID узла */
  newId: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует изменение ID узла в историю действий
 *
 * @param {NodeIdChangeLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logNodeIdChange({
 *   node: selectedNode,
 *   oldId: 'old-id',
 *   newId: 'new-id',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logNodeIdChange({ node, oldId, newId, onActionLog }: NodeIdChangeLogOptions): void {
  onActionLog('id_change', `Изменён ID узла "${oldId}" → "${newId}" (${node.type})`);
}
