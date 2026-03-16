/**
 * @fileoverview Функция рендеринга шаблона button-response обработчика
 * @module templates/handlers/button-response/button-response.renderer
 */

import type { ButtonResponseTemplateParams } from './button-response.params';
import { buttonResponseParamsSchema } from './button-response.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерация Python кода обработчика button-response с валидацией параметров
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateButtonResponse({
 *   userInputNodes: [
 *     {
 *       id: 'node_123',
 *       responseOptions: [
 *         { text: 'Опция 1', value: 'opt1' },
 *         { text: 'Опция 2', value: 'opt2' },
 *       ],
 *       allowSkip: true,
 *     },
 *   ],
 *   allNodes: [...],
 *   hasUrlButtonsInProject: false,
 * });
 * ```
 */
export function generateButtonResponse(params: ButtonResponseTemplateParams): string {
  const validated = buttonResponseParamsSchema.parse(params);
  return renderPartialTemplate('handlers/button-response/button-response.py.jinja2', validated);
}
