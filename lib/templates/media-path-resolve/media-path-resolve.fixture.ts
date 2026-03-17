/**
 * @fileoverview Тестовые данные для шаблона media-path-resolve
 * @module templates/media-path-resolve/media-path-resolve.fixture
 */

import type { MediaPathResolveTemplateParams } from './media-path-resolve.params';

/** Валидные параметры: фото */
export const validParamsPhoto: MediaPathResolveTemplateParams = {
  mediaType: 'photo',
  urlVar: 'image_url',
};

/** Валидные параметры: видео */
export const validParamsVideo: MediaPathResolveTemplateParams = {
  mediaType: 'video',
  urlVar: 'video_url',
};

/** Валидные параметры: аудио */
export const validParamsAudio: MediaPathResolveTemplateParams = {
  mediaType: 'audio',
  urlVar: 'audio_url',
};

/** Валидные параметры: документ */
export const validParamsDocument: MediaPathResolveTemplateParams = {
  mediaType: 'document',
  urlVar: 'document_url',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: MediaPathResolveTemplateParams = {
  mediaType: 'photo',
  urlVar: 'photo_url',
  indentLevel: '    ',
};
