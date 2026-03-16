/**
 * @fileoverview Функция рендеринга шаблона multi-select button обработчика
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.renderer
 */

import type { MultiSelectButtonHandlerTemplateParams } from './multi-select-button-handler.params';
import { multiSelectButtonHandlerParamsSchema } from './multi-select-button-handler.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерация Python кода обработчика multi-select button с валидацией параметров
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateMultiSelectButtonHandler({
 *   targetNode: { ... },
 *   callbackData: 'ms_abc123_btn456',
 *   button: { id: 'btn_1', text: 'Опция 1', action: 'goto', target: 'next' },
 *   node: { id: 'node_123', inputVariable: 'user_choice' },
 *   nodes: [...],
 * });
 * ```
 */
export function generateMultiSelectButtonHandler(params: MultiSelectButtonHandlerTemplateParams): string {
  const validated = multiSelectButtonHandlerParamsSchema.parse(params);
  return renderPartialTemplate('handlers/multi-select-button-handler/multi-select-button-handler.py.jinja2', validated);
}
