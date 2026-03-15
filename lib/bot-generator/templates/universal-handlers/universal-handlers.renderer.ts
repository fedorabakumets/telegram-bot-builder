/**
 * @fileoverview Функция рендеринга шаблона универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.renderer
 */

import type { UniversalHandlersTemplateParams } from './universal-handlers.params';
import { universalHandlersParamsSchema } from './universal-handlers.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python универсальных обработчиков с валидацией параметров
 * @param params - Параметры обработчиков
 * @returns Сгенерированный Python код обработчиков
 *
 * @example
 * ```typescript
 * const code = generateUniversalHandlers({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateUniversalHandlers(params: UniversalHandlersTemplateParams): string {
  const validated = universalHandlersParamsSchema.parse({
    ...params,
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
  });
  return renderPartialTemplate('universal-handlers/universal-handlers.py.jinja2', validated);
}
