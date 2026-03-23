/**
 * @fileoverview Renderer для шаблона skip-data-collection
 * @module templates/skip-data-collection/skip-data-collection.renderer
 */

import type { SkipDataCollectionTemplateParams } from './skip-data-collection.params';
import { skipDataCollectionParamsSchema } from './skip-data-collection.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерирует Python-код проверки skipDataCollection.
 * @param params - Параметры проверки
 * @returns Сгенерированный Python код
 */
export function generateSkipDataCollectionCheck(params: SkipDataCollectionTemplateParams): string {
  const validated = skipDataCollectionParamsSchema.parse(params);
  return renderPartialTemplate('skip-data-collection/skip-data-collection.py.jinja2', validated);
}
