/**
 * @fileoverview Функция рендеринга шаблона multi-select reply обработчика
 * @module templates/handlers/multi-select-reply/multi-select-reply.renderer
 */

import type { MultiSelectReplyTemplateParams } from './multi-select-reply.params';
import { multiSelectReplyParamsSchema } from './multi-select-reply.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерация Python кода обработчика multi-select reply с валидацией параметров
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateMultiSelectReply({
 *   multiSelectNodes: [
 *     {
 *       id: 'node_123',
 *       variableName: 'user_interests',
 *       selectionButtons: [...],
 *       regularButtons: [...],
 *       gotoButtons: [...],
 *       completeButton: { text: 'Готово' },
 *     },
 *   ],
 *   allNodes: [...],
 *   allNodeIds: ['node_123'],
 * });
 * ```
 */
export function generateMultiSelectReply(params: MultiSelectReplyTemplateParams): string {
  const validated = multiSelectReplyParamsSchema.parse(params);
  return renderPartialTemplate('handlers/multi-select-reply/multi-select-reply.py.jinja2', validated);
}
