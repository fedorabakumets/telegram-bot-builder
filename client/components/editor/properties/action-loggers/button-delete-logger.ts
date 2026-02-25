/**
 * @fileoverview Утилита для логирования удаления кнопки
 *
 * Фиксирует удаление кнопки из узла.
 *
 * @module button-delete-logger
 */

import { Node } from '@shared/schema';

/**
 * Параметры для логирования удаления кнопки
 */
export interface ButtonDeleteLogOptions {
  /** Узел, у которого удалена кнопка */
  node: Node;
  /** ID удалённой кнопки */
  buttonId: string;
  /** Текст удалённой кнопки (опционально) */
  buttonText?: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует удаление кнопки в историю действий
 *
 * @param {ButtonDeleteLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logButtonDelete({
 *   node: selectedNode,
 *   buttonId: 'btn-123',
 *   buttonText: 'Кнопка',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logButtonDelete({ node, buttonId, buttonText, onActionLog }: ButtonDeleteLogOptions): void {
  const textInfo = buttonText ? `"${buttonText}"` : `(${buttonId})`;
  onActionLog('button_delete', `Удалена кнопка ${textInfo} из узла "${node.type}" (${node.id})`);
}
