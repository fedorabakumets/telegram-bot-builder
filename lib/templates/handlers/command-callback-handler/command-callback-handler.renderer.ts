/**
 * @fileoverview Рендерер шаблона command-callback-handler
 * @module templates/handlers/command-callback-handler/command-callback-handler.renderer
 */

import { commandCallbackHandlerParamsSchema, type CommandCallbackHandlerParams } from './command-callback-handler.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерация обработчика командной callback кнопки через Jinja2 шаблон
 *
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python код
 */
export function generateCommandCallbackHandler(params: CommandCallbackHandlerParams): string {
  // Валидация параметров
  const validatedParams = commandCallbackHandlerParamsSchema.parse(params);

  // Рендеринг шаблона
  return renderPartialTemplate('handlers/command-callback-handler/command-callback-handler.py.jinja2', {
    callbackData: validatedParams.callbackData,
    button: validatedParams.button,
    indentLevel: validatedParams.indentLevel,
  });
}
