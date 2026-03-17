/**
 * @fileoverview Renderer для шаблона error-handler
 * @module templates/error-handler/error-handler.renderer
 */

import type { ErrorHandlerTemplateParams } from './error-handler.params';
import { errorHandlerParamsSchema } from './error-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код блока except для обработки ошибок.
 * @param params - Параметры обработчика ошибок
 * @returns Сгенерированный Python код
 */
export function generateErrorHandler(params: ErrorHandlerTemplateParams = {}): string {
  const validated = errorHandlerParamsSchema.parse(params);
  return renderPartialTemplate('error-handler/error-handler.py.jinja2', validated);
}
