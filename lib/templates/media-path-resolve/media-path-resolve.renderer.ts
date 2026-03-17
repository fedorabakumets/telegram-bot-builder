/**
 * @fileoverview Renderer для шаблона media-path-resolve
 * @module templates/media-path-resolve/media-path-resolve.renderer
 */

import type { MediaPathResolveTemplateParams } from './media-path-resolve.params';
import { mediaPathResolveParamsSchema } from './media-path-resolve.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код резолвинга пути к медиафайлу.
 * @param params - Параметры резолвинга
 * @returns Сгенерированный Python код
 */
export function generateMediaPathResolve(params: MediaPathResolveTemplateParams): string {
  const validated = mediaPathResolveParamsSchema.parse(params);
  return renderPartialTemplate('media-path-resolve/media-path-resolve.py.jinja2', validated);
}
