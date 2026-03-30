/**
 * @fileoverview Renderer для шаблона обработчика условного ввода
 * @module templates/conditional-input-handler/conditional-input-handler.renderer
 */

import type { ConditionalInputHandlerTemplateParams, ConditionalNavNode } from './conditional-input-handler.params';
import { conditionalInputHandlerParamsSchema } from './conditional-input-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

function hasSkipDataCollectionButtons(nodes: ConditionalNavNode[] = []): boolean {
  const hasSkip = (buttons: any[] | undefined) =>
    Array.isArray(buttons) && buttons.some(button => button?.skipDataCollection === true && !!button?.target);

  return (nodes ?? []).some(node =>
    hasSkip(node?.data?.buttons) ||
    (node?.data?.conditionalMessages ?? []).some((message: any) => hasSkip(message?.buttons))
  );
}

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
  return renderPartialTemplate('conditional-input-handler/conditional-input-handler.py.jinja2', {
    ...validated,
    hasSkipDataCollectionButtons:
      validated.hasSkipDataCollectionButtons ?? hasSkipDataCollectionButtons(validated.nodes),
  });
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
