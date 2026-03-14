/**
 * @fileoverview Функция рендеринга шаблона конфигурации
 * @module templates/config/config.renderer
 */

import type { ConfigTemplateParams } from './config.params';
import { configParamsSchema } from './config.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python конфигурации с валидацией параметров
 * @param params - Параметры конфигурации
 * @returns Сгенерированный Python код конфигурации
 *
 * @example
 * ```typescript
 * const code = generateConfig({
 *   userDatabaseEnabled: true,
 *   projectId: 123,
 * });
 * ```
 */
export function generateConfig(params: ConfigTemplateParams): string {
  const validated = configParamsSchema.parse(params);
  return renderPartialTemplate('config/config.py.jinja2', validated);
}
