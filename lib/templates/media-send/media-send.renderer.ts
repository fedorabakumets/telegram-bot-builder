/**
 * @fileoverview Renderer для шаблона media-send
 * @module templates/media-send/media-send.renderer
 */

import type { MediaSendTemplateParams } from './media-send.params';
import { mediaSendParamsSchema } from './media-send.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код отправки медиафайлов.
 * @param params - Параметры отправки медиа
 * @returns Сгенерированный Python код
 */
export function generateMediaSend(params: MediaSendTemplateParams): string {
  const validated = mediaSendParamsSchema.parse(params);
  return renderPartialTemplate('media-send/media-send.py.jinja2', validated);
}

/** Строит параметры из данных узла */
export function buildMediaSendParams(node: any, indent?: string): MediaSendTemplateParams {
  return {
    nodeId: node.id,
    imageUrl: node.data.imageUrl,
    videoUrl: node.data.videoUrl,
    audioUrl: node.data.audioUrl,
    documentUrl: node.data.documentUrl,
    indentLevel: indent,
  };
}
