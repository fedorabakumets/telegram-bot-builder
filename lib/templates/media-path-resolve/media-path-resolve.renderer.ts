import type { MediaPathResolveTemplateParams } from './media-path-resolve.params';
import { renderPartialTemplate } from '../template-renderer';

export function generateMediaPathResolve(params: MediaPathResolveTemplateParams): string {
  return renderPartialTemplate('media-path-resolve/media-path-resolve.py.jinja2', params);
}
