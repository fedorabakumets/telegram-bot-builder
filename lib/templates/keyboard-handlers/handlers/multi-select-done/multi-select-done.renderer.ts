/**
 * @fileoverview Функция рендеринга шаблона multi-select done обработчика
 * @module templates/handlers/multi-select-done/multi-select-done.renderer
 */

import type { MultiSelectDoneTemplateParams } from './multi-select-done.params';
import { multiSelectDoneParamsSchema } from './multi-select-done.schema';
import { renderPartialTemplate } from '../../../template-renderer';

/**
 * Генерация Python кода обработчика multi-select done с валидацией параметров
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateMultiSelectDone({
 *   multiSelectNodes: [
 *     {
 *       id: 'node_123',
 *       variableName: 'user_interests',
 *       continueButtonTarget: 'next_node',
 *       targetNode: {...},
 *     },
 *   ],
 *   allNodes: [...],
 *   allNodeIds: ['node_123', 'next_node'],
 * });
 * ```
 */
export function generateMultiSelectDone(params: MultiSelectDoneTemplateParams): string {
  const validated = multiSelectDoneParamsSchema.parse(params);
  return renderPartialTemplate('keyboard-handlers/handlers/multi-select-done/multi-select-done.py.jinja2', validated);
}
