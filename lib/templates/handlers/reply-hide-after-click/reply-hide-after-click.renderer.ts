/**
 * @fileoverview Рендерер шаблона reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.renderer
 */

import nunjucks from 'nunjucks';
import { replyHideAfterClickParamsSchema, type ReplyHideAfterClickParams } from './reply-hide-after-click.schema';

/**
 * Генерация кода обработки hideAfterClick через Jinja2 шаблон
 *
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 */
export function generateReplyHideAfterClick(params: ReplyHideAfterClickParams): string {
  // Валидация параметров
  const validatedParams = replyHideAfterClickParamsSchema.parse(params);

  // Рендеринг шаблона
  const template = nunjucks.render('handlers/reply-hide-after-click/reply-hide-after-click.py.jinja2', {
    nodes: validatedParams.nodes,
    indentLevel: validatedParams.indentLevel,
  });

  return template;
}
