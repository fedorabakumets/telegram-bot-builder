/**
 * @fileoverview Функция рендеринга шаблона middleware
 * @module templates/middleware/middleware.renderer
 */

import type { MiddlewareTemplateParams } from './middleware.params';
import { middlewareParamsSchema } from './middleware.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python middleware с валидацией параметров
 * @param params - Параметры middleware
 * @returns Сгенерированный Python код middleware
 *
 * @example
 * ```typescript
 * const code = generateMiddleware({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateMiddleware(params: MiddlewareTemplateParams): string {
  const validated = middlewareParamsSchema.parse({
    ...params,
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
  });
  return renderPartialTemplate('middleware/middleware.py.jinja2', validated);
}
