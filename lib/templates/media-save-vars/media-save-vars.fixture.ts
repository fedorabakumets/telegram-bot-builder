/**
 * @fileoverview Тестовые данные для шаблона media-save-vars
 * @module templates/media-save-vars/media-save-vars.fixture
 */

import type { MediaSaveVarsTemplateParams } from './media-save-vars.params';

/** Валидные параметры: с imageUrl */
export const validParamsWithImage: MediaSaveVarsTemplateParams = {
  nodeId: 'node_img',
  imageUrl: 'https://example.com/photo.jpg',
};

/** Валидные параметры: с videoUrl */
export const validParamsWithVideo: MediaSaveVarsTemplateParams = {
  nodeId: 'node_vid',
  videoUrl: 'https://example.com/video.mp4',
};

/** Валидные параметры: без медиа */
export const validParamsEmpty: MediaSaveVarsTemplateParams = {
  nodeId: 'node_empty',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: MediaSaveVarsTemplateParams = {
  nodeId: 'node_indent',
  imageUrl: 'https://example.com/img.jpg',
  indentLevel: '    ',
};
