/**
 * @fileoverview Функция рендеринга макроса обработчика узлов
 * @module templates/macros/handler.renderer
 */

import type { HandlerMacroParams } from './handler.params';
import { handlerMacroParamsSchema } from './handler.schema';
import { renderMacro } from '../template-renderer';

/**
 * Генерация Python обработчика узла с валидацией параметров
 * @param params - Параметры макроса
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = renderHandlerMacro({
 *   node: {
 *     id: 'start_1',
 *     type: 'start',
 *     data: { messageText: 'Hello!' },
 *   },
 *   enableComments: true,
 * });
 * ```
 */
export function renderHandlerMacro(params: HandlerMacroParams): string {
  const validated = handlerMacroParamsSchema.parse(params);
  return renderMacro('handler.py.jinja2', 'render_node_handler', validated);
}
