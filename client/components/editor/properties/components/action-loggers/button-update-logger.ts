/**
 * @fileoverview Утилита для логирования обновления кнопки
 *
 * Фиксирует изменение параметров кнопки узла.
 *
 * @module button-update-logger
 */

import { Node } from '@shared/schema';

/**
 * Параметры для логирования обновления кнопки
 */
export interface ButtonUpdateLogOptions {
  /** Узел, у которого обновлена кнопка */
  node: Node;
  /** ID обновлённой кнопки */
  buttonId: string;
  /** Ключи обновлённых полей (опционально) */
  updatedFields?: string[];
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует обновление кнопки в историю действий
 *
 * @param {ButtonUpdateLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logButtonUpdate({
 *   node: selectedNode,
 *   buttonId: 'btn-123',
 *   updatedFields: ['text', 'action'],
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logButtonUpdate({ node, buttonId, updatedFields, onActionLog }: ButtonUpdateLogOptions): void {
  const fieldsInfo = updatedFields?.length 
    ? ` (${updatedFields.join(', ')})` 
    : '';
  
  onActionLog('button_update', `Обновлена кнопка (${buttonId})${fieldsInfo} в узле "${node.type}" (${node.id})`);
}
