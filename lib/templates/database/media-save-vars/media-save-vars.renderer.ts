/**
 * @fileoverview Renderer для шаблона media-save-vars
 * @module templates/media-save-vars/media-save-vars.renderer
 */

import type { MediaSaveVarsTemplateParams } from './media-save-vars.params';
import { mediaSaveVarsParamsSchema } from './media-save-vars.schema';
import { renderPartialTemplate } from '../../template-renderer';

/**
 * Генерирует Python-код сохранения медиа-переменных.
 * @param params - Параметры сохранения медиа
 * @returns Сгенерированный Python код
 */
export function generateMediaSaveVars(params: MediaSaveVarsTemplateParams): string {
  const validated = mediaSaveVarsParamsSchema.parse(params);
  return renderPartialTemplate('database/media-save-vars/media-save-vars.py.jinja2', validated);
}

/** Строит параметры из данных узла */
export function buildMediaSaveVarsParams(node: any, indent?: string): MediaSaveVarsTemplateParams {
  return {
    nodeId: node.id,
    imageUrl: node.data.imageUrl,
    videoUrl: node.data.videoUrl,
    audioUrl: node.data.audioUrl,
    documentUrl: node.data.documentUrl,
    indentLevel: indent,
  };
}
