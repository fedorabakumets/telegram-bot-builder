/**
 * @fileoverview Функция рендеринга шаблона базы данных
 * @module templates/database/database.renderer
 */

import type { DatabaseTemplateParams } from './database.params';
import { databaseParamsSchema } from './database.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python функций базы данных с валидацией параметров
 * @param params - Параметры базы данных
 * @returns Сгенерированный Python код функций БД
 *
 * @example
 * ```typescript
 * const code = generateDatabase({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateDatabase(params: DatabaseTemplateParams): string {
  const validated = databaseParamsSchema.parse({
    ...params,
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
  });
  return renderPartialTemplate('database/database.py.jinja2', validated);
}
