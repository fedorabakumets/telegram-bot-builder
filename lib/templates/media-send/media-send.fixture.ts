/**
 * @fileoverview Тестовые данные для шаблона media-send
 * @module templates/media-send/media-send.fixture
 */

import type { MediaSendTemplateParams } from './media-send.params';

/** Валидные параметры: отправка фото */
export const validParamsWithImage: MediaSendTemplateParams = {
  nodeId: 'node_img',
  imageUrl: 'https://example.com/photo.jpg',
};

/** Валидные параметры: отправка фото из uploads */
export const validParamsWithUploadImage: MediaSendTemplateParams = {
  nodeId: 'node_upload',
  imageUrl: '/uploads/photo.jpg',
};

/** Валидные параметры: отправка видео */
export const validParamsWithVideo: MediaSendTemplateParams = {
  nodeId: 'node_vid',
  videoUrl: 'https://example.com/video.mp4',
};

/** Валидные параметры: без медиа */
export const validParamsEmpty: MediaSendTemplateParams = {
  nodeId: 'node_empty',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: MediaSendTemplateParams = {
  nodeId: 'node_indent',
  imageUrl: 'https://example.com/img.jpg',
  indentLevel: '    ',
};
