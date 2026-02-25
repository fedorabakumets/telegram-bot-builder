/**
 * @fileoverview Утилиты для сброса узлов к значениям по умолчанию
 *
 * Предоставляет функции для восстановления настроек узла
 * к исходным значениям согласно его типу.
 *
 * @module node-reset
 */

import { Node } from '@shared/schema';
import { getNodeDefaults } from '../node-defaults';

/**
 * Параметры для сброса узла
 */
export interface NodeResetOptions {
  /** Узел для сброса */
  node: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Функция логирования действий (опционально) */
  onActionLog?: (type: string, description: string) => void;
}

/**
 * Сбрасывает настройки узла к значениям по умолчанию
 *
 * @param {NodeResetOptions} options - Параметры сброса
 *
 * @example
 * ```typescript
 * handleNodeReset({
 *   node: selectedNode,
 *   onNodeUpdate: (id, data) => updateNode(id, data),
 *   onActionLog: (type, desc) => logAction(type, desc)
 * });
 * ```
 */
export function handleNodeReset({ node, onNodeUpdate, onActionLog }: NodeResetOptions): void {
  const defaults = getNodeDefaults(node.type);
  
  console.log('🔄 Сброс узла:', node.type, defaults);
  
  onNodeUpdate(node.id, defaults);
  
  if (onActionLog) {
    onActionLog('reset', `Сброшен узел "${node.type}" (${node.id})`);
  }
}
