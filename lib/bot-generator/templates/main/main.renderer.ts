/**
 * @fileoverview Функция рендеринга шаблона запуска бота
 * @module templates/main/main.renderer
 */

import type { MainTemplateParams } from './main.params';
import { mainParamsSchema } from './main.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python функции main() с валидацией параметров
 * @param params - Параметры запуска
 * @returns Сгенерированный Python код функции main
 *
 * @example
 * ```typescript
 * const code = generateMain({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateMain(params: MainTemplateParams): string {
  const validated = mainParamsSchema.parse(params);
  return renderPartialTemplate('main/main.py.jinja2', validated);
}
