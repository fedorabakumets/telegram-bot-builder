/**
 * @fileoverview Параметры шаблона animation-handler
 * @module templates/animation-handler/animation-handler.params
 */

/** Параметры для генерации кода отправки анимации */
export interface AnimationHandlerTemplateParams {
  /** URL анимации (GIF) */
  animationUrl?: string;
  /** ID узла */
  nodeId?: string;
  /** Уровень отступа */
  indentLevel?: string;
  /** Флаг: animationUrl является локальным путём /uploads/ */
  isLocalAnimationUrl?: boolean;
}
