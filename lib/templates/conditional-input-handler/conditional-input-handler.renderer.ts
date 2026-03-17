/**
 * @fileoverview Renderer для шаблона обработчика условного ввода
 * @module templates/conditional-input-handler/conditional-input-handler.renderer
 */

import type { ConditionalInputHandlerTemplateParams, ConditionalNavNode } from './conditional-input-handler.params';
import { conditionalInputHandlerParamsSchema } from './conditional-input-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код обработчика waiting_for_conditional_input.
 *
 * Включает:
 * - проверку skipDataCollection кнопок
 * - навигацию при пропуске
 * - сохранение ответа в БД
 * - навигацию к следующему узлу
 */
export function generateConditionalInputHandler(params: ConditionalInputHandlerTemplateParams): string {
  const validated = conditionalInputHandlerParamsSchema.parse(params);
  return renderPartialTemplate('conditional-input-handler/conditional-input-handler.py.jinja2', validated);
}

/**
 * Собирает ConditionalNavNode[] из массива узлов графа
 */
export function collectConditionalNavNodes(nodes: any[]): ConditionalNavNode[] {
  return (nodes || [])
    .filter(n => n != null && n.id)
    .map(n => ({
      id: n.id,
      safeName: n.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      type: n.type || 'message',
      data: n.data || {},
    }));
}
