/**
 * @fileoverview Рендерер шаблона reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.renderer
 */

import { replyHideAfterClickParamsSchema, type ReplyHideAfterClickParams } from './reply-hide-after-click.schema';
import { renderPartialTemplate } from '../../template-renderer';

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
  return renderPartialTemplate('handlers/reply-hide-after-click/reply-hide-after-click.py.jinja2', {
    nodes: validatedParams.nodes,
    indentLevel: validatedParams.indentLevel,
  });
}
