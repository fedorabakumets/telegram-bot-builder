/**
 * @fileoverview Renderer для шаблона runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.renderer
 */

import type { HandleUserInputTemplateParams } from './handle-user-input.params';
import { handleUserInputParamsSchema } from './handle-user-input.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код блока runtime-обработки пользовательского ввода.
 *
 * @param params - параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateHandleUserInput(params: HandleUserInputTemplateParams = {}): string {
  const validated = handleUserInputParamsSchema.parse(params);
  return renderPartialTemplate('handle-user-input/handle-user-input.py.jinja2', validated)
    .replace(/\n{3,}/g, '\n\n');
}
