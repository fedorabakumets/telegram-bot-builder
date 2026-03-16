/**
 * @fileoverview Рендерер шаблона reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.renderer
 */

import { replyButtonHandlersParamsSchema, type ReplyButtonHandlersParams } from './reply-button-handlers.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерация обработчиков reply кнопок через Jinja2 шаблон
 *
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 */
export function generateReplyButtonHandlers(params: ReplyButtonHandlersParams): string {
  // Валидация параметров
  const validatedParams = replyButtonHandlersParamsSchema.parse(params);

  // Рендеринг шаблона
  return renderPartialTemplate('handlers/reply-button-handlers/reply-button-handlers.py.jinja2', {
    nodes: validatedParams.nodes,
    indentLevel: validatedParams.indentLevel,
  });
}
