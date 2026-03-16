/**
 * @fileoverview Рендерер шаблона reply-button-handlers
 * @module templates/handlers/reply-button-handlers/reply-button-handlers.renderer
 */

import nunjucks from 'nunjucks';
import { replyButtonHandlersParamsSchema, type ReplyButtonHandlersParams } from './reply-button-handlers.schema';

/**
 * Генерация обработчиков reply кнопок через Jinja2 шаблон
 *
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 */
export function generateReplyButtonHandlers(params: ReplyButtonHandlersParams): string {
  // Валидация параметров
  const validatedParams = replyButtonHandlersParamsSchema.parse(params);

  // Настройка nunjucks
  const env = nunjucks.configure({
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
  });

  // Рендеринг шаблона
  const template = nunjucks.render('handlers/reply-button-handlers/reply-button-handlers.py.jinja2', {
    nodes: validatedParams.nodes,
    indentLevel: validatedParams.indentLevel,
  });

  return template;
}
