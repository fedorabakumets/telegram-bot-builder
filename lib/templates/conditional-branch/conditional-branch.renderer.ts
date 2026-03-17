/**
 * @fileoverview Renderer для шаблона conditional-branch
 * @module templates/conditional-branch/conditional-branch.renderer
 */

import type { ConditionalBranchTemplateParams } from './conditional-branch.params';
import { conditionalBranchParamsSchema } from './conditional-branch.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код условия if/elif для одного узла.
 * @param params - Параметры условного ветвления
 * @returns Сгенерированный Python код
 */
export function generateConditionalBranch(params: ConditionalBranchTemplateParams): string {
  const validated = conditionalBranchParamsSchema.parse(params);
  return renderPartialTemplate('conditional-branch/conditional-branch.py.jinja2', validated);
}
