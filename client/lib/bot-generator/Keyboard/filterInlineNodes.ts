/**
 * @fileoverview Утилита для фильтрации inline узлов
 * 
 * Модуль предоставляет функцию для фильтрации узлов с callback кнопками,
 * которые требуют обработчиков callback-запросов.
 * 
 * @module bot-generator/Keyboard/filterInlineNodes
 */

import type { BotNode } from '../types';

/**
 * Фильтрует узлы с inline callback кнопками
 * 
 * @param nodes - Массив узлов для фильтрации
 * @returns Отфильтрованный массив inline узлов
 * 
 * @example
 * const inlineNodes = filterInlineNodes(nodes);
 */
export function filterInlineNodes(nodes: BotNode[]): BotNode[] {
  return nodes
    .filter(node => node !== null && node !== undefined)
    .filter(node => {
      const hasCallbackButtons = node.data?.buttons &&
        Array.isArray(node.data.buttons) &&
        node.data.buttons.some((button) => button.action === 'callback');

      return hasCallbackButtons;
    });
}
