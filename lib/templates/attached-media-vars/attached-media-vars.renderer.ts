import type { AttachedMediaVarsTemplateParams } from './attached-media-vars.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateAttachedMediaVars(params: AttachedMediaVarsTemplateParams): string {
  return renderPartialTemplate('attached-media-vars/attached-media-vars.py.jinja2', params);
}

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
