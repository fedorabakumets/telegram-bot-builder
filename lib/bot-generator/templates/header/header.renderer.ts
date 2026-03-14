/**
 * @fileoverview Функция рендеринга шаблона заголовка
 * @module templates/header/header.renderer
 */

import type { HeaderTemplateParams } from './header.params';
import { headerParamsSchema } from './header.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python заголовка (UTF-8 кодировка) с валидацией параметров
 * @param params - Параметры заголовка
 * @returns Сгенерированный Python код заголовка
 *
 * @example
 * ```typescript
 * const code = generateHeader({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateHeader(params: HeaderTemplateParams): string {
  const validated = headerParamsSchema.parse(params);
  return renderPartialTemplate('header/header.py.jinja2', validated);
}
