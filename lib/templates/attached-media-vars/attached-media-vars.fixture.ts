/**
 * @fileoverview Тестовые данные для шаблона attached-media-vars
 * @module templates/attached-media-vars/attached-media-vars.fixture
 */

import type { AttachedMediaVarsTemplateParams } from './attached-media-vars.params';

/** Валидные параметры: с imageUrl */
export const validParamsWithImage: AttachedMediaVarsTemplateParams = {
  nodeId: 'node_img',
  attachedMedia: ['imageUrlVar_node_img'],
  imageUrl: 'https://example.com/photo.jpg',
};

/** Валидные параметры: с videoUrl */
export const validParamsWithVideo: AttachedMediaVarsTemplateParams = {
  nodeId: 'node_vid',
  attachedMedia: ['videoUrlVar_node_vid'],
  videoUrl: 'https://example.com/video.mp4',
};

/** Валидные параметры: без медиа */
export const validParamsEmpty: AttachedMediaVarsTemplateParams = {
  nodeId: 'node_empty',
  attachedMedia: [],
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: AttachedMediaVarsTemplateParams = {
  nodeId: 'node_indent',
  attachedMedia: ['imageUrlVar_node_indent'],
  imageUrl: 'https://example.com/img.jpg',
  indentLevel: '    ',
};
