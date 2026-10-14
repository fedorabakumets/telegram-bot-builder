/**
 * @fileoverview Renderer для шага сценария animation-handler
 * @module templates/animation-handler/animation-handler.renderer
 */

import type { AnimationHandlerTemplateParams } from './animation-handler.params';
import { animationHandlerParamsSchema } from './animation-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код отправки анимации при входе в блок.
 * Поле command в данных узла не используется как триггер.
 * @param params - Параметры анимации
 * @returns Сгенерированный Python код
 */
export function generateAnimationHandler(params: AnimationHandlerTemplateParams): string {
  const animationUrl = params.animationUrl ?? '';
  const isLocalAnimationUrl = params.isLocalAnimationUrl
    ?? animationUrl.startsWith('/uploads/');
  const validated = animationHandlerParamsSchema.parse({
    ...params,
    isLocalAnimationUrl,
    autoTransitionTo: (params.autoTransitionTo || '').trim(),
    mediaCaption: params.mediaCaption ?? '',
  });
  return renderPartialTemplate('animation-handler/animation-handler.py.jinja2', validated);
}
