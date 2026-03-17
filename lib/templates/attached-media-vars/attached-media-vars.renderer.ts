/**
 * @fileoverview Renderer для шаблона attached-media-vars
 * @module templates/attached-media-vars/attached-media-vars.renderer
 */

import type { AttachedMediaVarsTemplateParams } from './attached-media-vars.params';
import { attachedMediaVarsParamsSchema } from './attached-media-vars.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код установки переменных из attachedMedia.
 * @param params - Параметры медиа-переменных
 * @returns Сгенерированный Python код
 */
export function generateAttachedMediaVars(params: AttachedMediaVarsTemplateParams): string {
  const validated = attachedMediaVarsParamsSchema.parse(params);
  return renderPartialTemplate('attached-media-vars/attached-media-vars.py.jinja2', validated);
}

/** Строит параметры из данных узла */
export function buildAttachedMediaVarsParams(node: any, indent?: string): AttachedMediaVarsTemplateParams {
  return {
    nodeId: node.id,
    attachedMedia: node.data.attachedMedia || [],
    imageUrl: node.data.imageUrl,
    videoUrl: node.data.videoUrl,
    audioUrl: node.data.audioUrl,
    documentUrl: node.data.documentUrl,
    indentLevel: indent,
  };
}
