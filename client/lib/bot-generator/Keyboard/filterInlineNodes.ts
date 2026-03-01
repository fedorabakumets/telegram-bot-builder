/**
 * @fileoverview Утилита для фильтрации inline узлов
 *
 * Модуль предоставляет функцию для фильтрации узлов с callback кнопками,
 * которые требуют обработчиков callback-запросов.
 *
 * @module bot-generator/Keyboard/filterInlineNodes
 */

import type { EnhancedNode } from '../types/enhanced-node.types';

/**
 * Фильтрует узлы с inline callback кнопками
 *
 * @param nodes - Массив узлов для фильтрации
 * @returns Отфильтрованный массив inline узлов
 *
 * @example
 * const inlineNodes = filterInlineNodes(nodes);
 */
export function filterInlineNodes(nodes: EnhancedNode[]): EnhancedNode[] {
  return nodes
    .filter(node => node !== null && node !== undefined)
    .filter(node => {
      // Кнопки с действием 'selection' используются для inline callback кнопок
      const hasCallbackButtons = node.data?.buttons &&
        Array.isArray(node.data.buttons) &&
        node.data.buttons.some((button) => 
          button.action === 'selection' || button.buttonType === 'normal'
        );

      return hasCallbackButtons;
    });
}
