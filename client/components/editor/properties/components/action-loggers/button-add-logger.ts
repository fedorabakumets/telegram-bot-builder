/**
 * @fileoverview Утилита для логирования добавления кнопки
 *
 * Фиксирует добавление новой кнопки к узлу.
 *
 * @module button-add-logger
 */

import { Node } from '@shared/schema';

/**
 * Параметры для логирования добавления кнопки
 */
export interface ButtonAddLogOptions {
  /** Узел, к которому добавлена кнопка */
  node: Node;
  /** Текст добавленной кнопки */
  buttonText: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует добавление кнопки в историю действий
 *
 * @param {ButtonAddLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logButtonAdd({
 *   node: selectedNode,
 *   buttonText: 'Новая кнопка',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logButtonAdd({ node, buttonText, onActionLog }: ButtonAddLogOptions): void {
  onActionLog('button_add', `Добавлена кнопка "${buttonText}" к узлу "${node.type}" (${node.id})`);
}
