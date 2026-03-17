/**
 * @fileoverview Renderer для шаблона conditional-messages
 * Используется для простого выбора текста по условиям.
 * Для полной логики с клавиатурами используйте generateConditionalMessageLogic из bot-generator/Conditional.
 *
 * @module templates/conditional-messages/conditional-messages.renderer
 */

import type { ConditionalMessagesTemplateParams } from './conditional-messages.params';
import { conditionalMessagesParamsSchema } from './conditional-messages.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код простой проверки условных сообщений (только выбор текста).
 * @param params - Параметры условных сообщений
 * @returns Сгенерированный Python код
 */
export function generateConditionalMessages(params: ConditionalMessagesTemplateParams): string {
  const validated = conditionalMessagesParamsSchema.parse(params);
  return renderPartialTemplate('conditional-messages/conditional-messages.py.jinja2', validated);
}
