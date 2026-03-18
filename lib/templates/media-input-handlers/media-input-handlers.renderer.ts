/**
 * @fileoverview Renderer для шаблона обработчиков входящих медиафайлов
 * @module templates/media-input-handlers/media-input-handlers.renderer
 */

import type { MediaInputHandlersTemplateParams } from './media-input-handlers.params';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код обработчиков входящих медиафайлов от пользователя.
 * Заменяет photo-handler, audio-handler, video-handler, document-handler из MediaHandler.
 */
export function generateMediaInputHandlers(params: MediaInputHandlersTemplateParams): string {
  if (!params.hasPhotoInput && !params.hasVideoInput && !params.hasAudioInput && !params.hasDocumentInput) {
    return '';
  }
  return renderPartialTemplate('media-input-handlers/media-input-handlers.py.jinja2', params);
}
