/**
 * @fileoverview Рендерер шаблона загрузки контента
 * @module templates/content/content.renderer
 */

import { renderPartialTemplate } from '../template-renderer';
import { contentParamsSchema } from './content.schema';
import type { ContentTemplateParams } from './content.params';

/**
 * Генерирует Python-код загрузки контента из таблицы _content
 * @param params - Параметры шаблона
 * @returns Сгенерированный Python-код или пустая строка если projectId не задан
 */
export function generateContentCode(params: ContentTemplateParams): string {
  const validated = contentParamsSchema.parse(params);
  return renderPartialTemplate('content/content.py.jinja2', validated);
}
