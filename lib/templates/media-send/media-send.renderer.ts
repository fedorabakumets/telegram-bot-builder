import type { MediaSendTemplateParams } from './media-send.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateMediaSend(params: MediaSendTemplateParams): string {
  return renderPartialTemplate('media-send/media-send.py.jinja2', params);
}

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
