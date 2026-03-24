/**
 * @fileoverview Функция рендеринга шаблона медиа-ноды
 * @module templates/media-node/media-node.renderer
 */

import type { MediaNodeTemplateParams } from './media-node.params';
import { mediaNodeParamsSchema } from './media-node.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python-обработчика медиа-ноды с валидацией параметров
 * @param params - Параметры медиа-ноды
 * @returns Сгенерированный Python-код обработчика
 *
 * @example
 * ```typescript
 * const code = generateMediaNode({
 *   nodeId: 'media_1',
 *   attachedMedia: ['https://example.com/photo.jpg'],
 *   enableAutoTransition: true,
 *   autoTransitionTo: 'next_node',
 * });
 * ```
 */
export function generateMediaNode(params: MediaNodeTemplateParams): string {
  const validated = mediaNodeParamsSchema.parse(params);
  return renderPartialTemplate('media-node/media-node.py.jinja2', validated);
}
