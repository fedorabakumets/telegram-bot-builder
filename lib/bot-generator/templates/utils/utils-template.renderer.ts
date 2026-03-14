/**
 * @fileoverview Функция рендеринга шаблона утилит
 * @module templates/utils/utils-template.renderer
 */

import type { UtilsTemplateParams } from './utils-template.params';
import { utilsParamsSchema } from './utils-template.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python утилит с валидацией параметров
 * @param params - Параметры утилит
 * @returns Сгенерированный Python код утилит
 *
 * @example
 * ```typescript
 * const code = generateUtils({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateUtils(params: UtilsTemplateParams): string {
  const validated = utilsParamsSchema.parse(params);
  return renderPartialTemplate('utils/utils.py.jinja2', validated);
}
