/**
 * @fileoverview Renderer для шаблона conditional-messages
 * Используется для простого выбора текста по условиям.
 * Для полной логики с клавиатурами используйте generateConditionalMessageLogic из bot-generator/Conditional.
 *
 * @module templates/conditional-messages/conditional-messages.renderer
 */

import type { ConditionalMessagesTemplateParams } from './conditional-messages.params';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код простой проверки условных сообщений (только выбор текста).
 */
export function generateConditionalMessages(params: ConditionalMessagesTemplateParams): string {
  return renderPartialTemplate('conditional-messages/conditional-messages.py.jinja2', params);
}
