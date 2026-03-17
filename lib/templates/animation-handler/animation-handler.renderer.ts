/**
 * @fileoverview Renderer для шаблона animation-handler
 * @module templates/animation-handler/animation-handler.renderer
 */

import type { AnimationHandlerTemplateParams } from './animation-handler.params';
import { animationHandlerParamsSchema } from './animation-handler.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код отправки анимации (GIF).
 * @param params - Параметры анимации
 * @returns Сгенерированный Python код
 */
export function generateAnimationHandler(params: AnimationHandlerTemplateParams): string {
  const validated = animationHandlerParamsSchema.parse(params);
  return renderPartialTemplate('animation-handler/animation-handler.py.jinja2', validated);
}
