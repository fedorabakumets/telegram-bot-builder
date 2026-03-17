/**
 * @fileoverview Renderer для шаблона navigate_to_node
 * @module templates/navigation/navigate-to-node.renderer
 */

import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код вспомогательной функции navigate_to_node.
 * Заменяет generateNavigateToNode() из bot-generator/transitions/generate-node-navigation.ts
 */
export function generateNavigateToNode(): string {
  return renderPartialTemplate('navigation/navigate-to-node.py.jinja2', {});
}

/**
 * Генерирует вызов navigate_to_node
 */
export function generateNavigateToNodeCall(
  nodeId: string,
  messageVar: string = 'message',
  indent: string = ''
): string {
  return `${indent}await navigate_to_node(${messageVar}, "${nodeId}")\n`;
}

/**
 * Генерирует вызов navigate_to_node с кастомным текстом
 */
export function generateNavigateToNodeWithText(
  nodeId: string,
  textVar: string,
  messageVar: string = 'message',
  indent: string = ''
): string {
  return `${indent}await navigate_to_node(${messageVar}, "${nodeId}", text=${textVar})\n`;
}
