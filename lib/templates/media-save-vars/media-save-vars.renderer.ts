import type { MediaSaveVarsTemplateParams } from './media-save-vars.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateMediaSaveVars(params: MediaSaveVarsTemplateParams): string {
  return renderPartialTemplate('media-save-vars/media-save-vars.py.jinja2', params);
}

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
