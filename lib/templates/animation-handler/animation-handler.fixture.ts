/**
 * @fileoverview Тестовые данные для шаблона animation-handler
 * @module templates/animation-handler/animation-handler.fixture
 */

import type { AnimationHandlerTemplateParams } from './animation-handler.params';

/** Валидные параметры: анимация по URL */
export const validParamsWithUrl: AnimationHandlerTemplateParams = {
  animationUrl: 'https://example.com/animation.gif',
  nodeId: 'node_anim_1',
};

/** Валидные параметры: анимация из uploads */
export const validParamsWithUpload: AnimationHandlerTemplateParams = {
  animationUrl: '/uploads/animation.gif',
  nodeId: 'node_anim_2',
};

/** Валидные параметры: без анимации */
export const validParamsEmpty: AnimationHandlerTemplateParams = {
  nodeId: 'node_anim_3',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: AnimationHandlerTemplateParams = {
  animationUrl: 'https://example.com/anim.gif',
  nodeId: 'node_anim_4',
  indentLevel: '    ',
};
