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
  const validated = commandCallbackHandlerParamsSchema.safeParse(params);
  
  if (!validated.success) {
    throw new Error(JSON.stringify(validated.error.issues, null, 2));
  }

  // Рендеринг шаблона
  return renderPartialTemplate('handlers/command-callback-handler/command-callback-handler.py.jinja2', {
    callbackData: validated.data.callbackData,
    button: validated.data.button,
    indentLevel: validated.data.indentLevel ?? '',
    commandNode: validated.data.commandNode ?? '',
    command: validated.data.command ?? validated.data.button.target.replace('/', ''),
  });
}
