/**
 * @fileoverview Утилита для логирования обновления данных узла
 *
 * Фиксирует изменение настроек узла (текст, команды, параметры).
 *
 * @module node-update-logger
 */

import { Node } from '@shared/schema';

/**
 * Параметры для логирования обновления узла
 */
export interface NodeUpdateLogOptions {
  /** Узел, который был обновлён */
  node: Node;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
  /** Ключи обновлённых полей (опционально) */
  updatedFields?: string[];
}

/**
 * Логирует обновление данных узла в историю действий
 *
 * @param {NodeUpdateLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logNodeUpdate({
 *   node: selectedNode,
 *   onActionLog: handleActionLog,
 *   updatedFields: ['messageText', 'command']
 * });
 * ```
 */
export function logNodeUpdate({ node, onActionLog, updatedFields }: NodeUpdateLogOptions): void {
  const fieldsInfo = updatedFields?.length 
    ? ` (${updatedFields.join(', ')})` 
    : '';
  
  onActionLog('update', `Обновлены данные узла "${node.type}" (${node.id})${fieldsInfo}`);
}
