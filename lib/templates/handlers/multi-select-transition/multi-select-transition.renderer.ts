/**
 * @fileoverview Рендерер шаблона multi-select-transition
 * @module templates/handlers/multi-select-transition/multi-select-transition.renderer
 */

import nunjucks from 'nunjucks';
import { multiSelectTransitionParamsSchema, type MultiSelectTransitionParams } from './multi-select-transition.schema';

/**
 * Генерация логики переходов multi-select через Jinja2 шаблон
 *
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 */
export function generateMultiSelectTransition(params: MultiSelectTransitionParams): string {
  // Валидация параметров
  const validatedParams = multiSelectTransitionParamsSchema.parse(params);

  // Рендеринг шаблона
  const template = nunjucks.render('handlers/multi-select-transition/multi-select-transition.py.jinja2', {
    multiSelectNodes: validatedParams.multiSelectNodes,
    nodes: validatedParams.nodes,
    connections: validatedParams.connections || [],
    indentLevel: validatedParams.indentLevel,
  });

  return template;
}
