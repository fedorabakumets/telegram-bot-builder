/**
 * @fileoverview Функция рендеринга шаблона get_user_variables
 * @module templates/user-variables-func/user-variables-func.renderer
 */

import type { UserVariablesFuncTemplateParams } from './user-variables-func.params';
import { userVariablesFuncParamsSchema } from './user-variables-func.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код функции get_user_variables с валидацией параметров
 * @param params - Параметры шаблона (опционально)
 * @returns Сгенерированный Python-код функции
 *
 * @example
 * ```typescript
 * const code = generateGetUserVariablesFunction({ indentLevel: '    ' });
 * ```
 */
export function generateGetUserVariablesFunction(params: UserVariablesFuncTemplateParams = {}): string {
  const validated = userVariablesFuncParamsSchema.parse(params);
  return renderPartialTemplate('user-variables-func/user-variables-func.py.jinja2', validated);
}
