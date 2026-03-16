/**
 * @fileoverview Функция рендеринга шаблона multi-select callback обработчика
 * @module templates/handlers/multi-select-callback/multi-select-callback.renderer
 */

import type { MultiSelectCallbackTemplateParams } from './multi-select-callback.params';
import { multiSelectCallbackParamsSchema } from './multi-select-callback.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерация Python кода обработчика multi-select callback с валидацией параметров
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateMultiSelectCallback({
 *   multiSelectNodes: [
 *     {
 *       id: 'node_123',
 *       shortNodeId: 'abc123',
 *       selectionButtons: [...],
 *       regularButtons: [...],
 *       completeButton: { text: 'Готово', target: 'next' },
 *     },
 *   ],
 *   allNodeIds: ['node_123', 'next'],
 * });
 * ```
 */
export function generateMultiSelectCallback(params: MultiSelectCallbackTemplateParams): string {
  const validated = multiSelectCallbackParamsSchema.parse(params);
  return renderPartialTemplate('handlers/multi-select-callback/multi-select-callback.py.jinja2', validated);
}
