/**
 * @fileoverview Функция рендеринга шаблона импортов
 * @module templates/imports/imports.renderer
 */

import type { ImportsTemplateParams } from './imports.params';
import { importsParamsSchema } from './imports.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python импортов с валидацией параметров
 * @param params - Параметры импортов
 * @returns Сгенерированный Python код импортов
 *
 * @example
 * ```typescript
 * const code = generateImports({
 *   userDatabaseEnabled: true,
 *   hasInlineButtons: false,
 *   hasMediaNodes: true,
 * });
 * ```
 */
export function generateImports(params: ImportsTemplateParams): string {
  const validated = importsParamsSchema.parse({
    ...params,
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
    hasInlineButtons: params.hasInlineButtons ?? false,
    hasAutoTransitions: params.hasAutoTransitions ?? false,
    hasMediaNodes: params.hasMediaNodes ?? false,
    hasUploadImages: params.hasUploadImages ?? false,
  });
  return renderPartialTemplate('imports/imports.py.jinja2', validated);
}
