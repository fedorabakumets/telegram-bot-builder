/**
 * @fileoverview Функция рендеринга шаблона геолокации
 * @module templates/map/map.renderer
 */

import type { MapTemplateParams } from './map.params';
import { mapParamsSchema } from './map.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика геолокации с валидацией параметров
 * @param params - Параметры обработчика геолокации
 * @returns Сгенерированный Python код обработчика
 */
export function generateMap(params: MapTemplateParams): string {
  const validated = mapParamsSchema.parse({
    ...params,
    isPrivateOnly: params.isPrivateOnly ?? false,
    keyboardType: params.keyboardType ?? 'none',
    formatMode: params.formatMode ?? 'none',
    requestUserLocation: params.requestUserLocation ?? false,
  });

  return renderPartialTemplate('map/map.py.jinja2', { ...validated, handlerContext: 'callback' });
}
